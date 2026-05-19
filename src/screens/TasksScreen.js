import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { generateId } from '../storage';
import { COLORS, RADIUS, SHADOW, LIST_BADGE_COLORS } from '../theme';

function getListBadge(name) {
  return (name || '?').charAt(0).toUpperCase();
}

export default function TasksScreen() {
  const { state, setState } = useApp();
  const [activeListId, setActiveListId] = useState(null);
  const [taskInput, setTaskInput] = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState('once');
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColorIndex, setNewListColorIndex] = useState(0);
  const [newListIsWork, setNewListIsWork] = useState(false);

  const allLists = state.workLists || [];
  const lists = state.weekendMode ? allLists.filter((l) => !l.isWork) : allLists;
  const currentList = lists.find((l) => l.id === activeListId) || lists[0];
  const todos = currentList ? (state.workTodos[currentList.id] || []) : [];

  const sorted = [
    ...todos.filter((t) => !t.completed && t.important),
    ...todos.filter((t) => !t.completed && !t.important),
    ...todos.filter((t) => t.completed),
  ];

  function addTodo() {
    const text = taskInput.trim();
    if (!text || !currentList) return;
    const newTodo = {
      id: generateId(), text, completed: false,
      createdAt: new Date().toISOString(), completedAt: null,
      dueDate: null, notes: '', important: false, recurrence: taskRecurrence,
    };
    setState((s) => ({
      ...s,
      workTodos: { ...s.workTodos, [currentList.id]: [newTodo, ...(s.workTodos[currentList.id] || [])] },
    }));
    setTaskInput('');
    setTaskRecurrence('once');
  }

  function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const markingDone = !todo.completed;
    setState((s) => {
      let updated = (s.workTodos[currentList.id] || []).map((t) =>
        t.id === id ? { ...t, completed: markingDone, completedAt: markingDone ? new Date().toISOString() : null } : t
      );
      // Spawn recurring daily todo
      if (markingDone && todo.recurrence === 'daily') {
        updated = [{
          id: generateId(), text: todo.text, completed: false,
          createdAt: new Date().toISOString(), completedAt: null,
          dueDate: null, notes: todo.notes, important: false, recurrence: 'daily',
        }, ...updated];
      }
      return { ...s, workTodos: { ...s.workTodos, [currentList.id]: updated } };
    });
  }

  function toggleImportant(id) {
    setState((s) => ({
      ...s,
      workTodos: {
        ...s.workTodos,
        [currentList.id]: (s.workTodos[currentList.id] || []).map((t) =>
          t.id === id ? { ...t, important: !t.important } : t
        ),
      },
    }));
  }

  function deleteTodo(id) {
    setState((s) => ({
      ...s,
      workTodos: {
        ...s.workTodos,
        [currentList.id]: (s.workTodos[currentList.id] || []).filter((t) => t.id !== id),
      },
    }));
  }

  function createList() {
    const name = newListName.trim();
    if (!name) return;
    const newId = 'list-' + Date.now();
    setState((s) => ({
      ...s,
      workLists: [...(s.workLists || []), { id: newId, name, colorIndex: newListColorIndex, isWork: newListIsWork }],
      workTodos: { ...s.workTodos, [newId]: [] },
      workNotes: { ...s.workNotes, [newId]: '' },
    }));
    setActiveListId(newId);
    setNewListName('');
    setNewListColorIndex(0);
    setNewListIsWork(false);
    setShowNewList(false);
  }

  const color = currentList ? LIST_BADGE_COLORS[currentList.colorIndex ?? 0] : LIST_BADGE_COLORS[0];
  const openCount = todos.filter((t) => !t.completed).length;
  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page title */}
        <Text style={styles.pageTitle}>My Lists</Text>

        {/* List tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>
          {lists.map((list) => {
            const c = LIST_BADGE_COLORS[list.colorIndex ?? 0];
            const isActive = list.id === (currentList?.id);
            return (
              <TouchableOpacity key={list.id} style={[styles.tab, isActive && styles.tabActive]} onPress={() => setActiveListId(list.id)}>
                <View style={[styles.tabBadge, { backgroundColor: c.bg }]}>
                  <Text style={[styles.tabBadgeText, { color: c.text }]}>{getListBadge(list.name)}</Text>
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{list.name}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.tabAdd} onPress={() => setShowNewList(true)}>
            <Text style={styles.tabAddText}>+ New list</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Active list header */}
        {currentList && (
          <View style={styles.listHeader}>
            <View style={[styles.listBadge, { backgroundColor: color.bg }]}>
              <Text style={[styles.listBadgeText, { color: color.text }]}>{getListBadge(currentList.name)}</Text>
            </View>
            <View>
              <Text style={styles.listName}>{currentList.name}</Text>
              <Text style={styles.listMeta}>
                {openCount > 0 ? `${openCount} open · ${doneCount} done` : doneCount > 0 ? `All ${doneCount} done` : 'No tasks yet'}
              </Text>
            </View>
          </View>
        )}

        {/* Add task input */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Add a task…"
            placeholderTextColor={COLORS.textFaint}
            value={taskInput}
            onChangeText={setTaskInput}
            onSubmitEditing={addTodo}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recurRow}>
          <Text style={styles.recurLabel}>Repeat:</Text>
          {['once', 'daily'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.recurBtn, taskRecurrence === r && styles.recurBtnActive]}
              onPress={() => setTaskRecurrence(r)}
            >
              <Text style={[styles.recurBtnText, taskRecurrence === r && styles.recurBtnTextActive]}>
                {r === 'once' ? 'Once' : 'Daily'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task list */}
        <View style={styles.todoList}>
          {sorted.length === 0 && <Text style={styles.empty}>No tasks yet. Add one above.</Text>}
          {sorted.map((todo) => (
            <View key={todo.id} style={[styles.todoItem, todo.important && !todo.completed && styles.todoImportant]}>
              <Pressable style={[styles.check, todo.completed && styles.checkDone]} onPress={() => toggleTodo(todo.id)}>
                {todo.completed && <Text style={styles.checkMark}>✓</Text>}
              </Pressable>
              <Text style={[styles.todoText, todo.completed && styles.todoTextDone]} numberOfLines={2}>{todo.text}</Text>
              {!todo.completed && (
                <TouchableOpacity onPress={() => toggleImportant(todo.id)}>
                  <Text style={[styles.star, todo.important && styles.starActive]}>★</Text>
                </TouchableOpacity>
              )}
              {todo.recurrence === 'daily' && <Text style={styles.recurBadge}>↻</Text>}
              <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
                <Text style={styles.deleteBtn}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Notes */}
        {currentList && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Jot anything down…"
              placeholderTextColor={COLORS.textFaint}
              value={state.workNotes?.[currentList.id] || ''}
              onChangeText={(v) => setState((s) => ({
                ...s, workNotes: { ...s.workNotes, [currentList.id]: v },
              }))}
            />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* New List Modal */}
      <Modal visible={showNewList} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New List</Text>
            <TouchableOpacity onPress={() => setShowNewList(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.fieldLabel}>LIST NAME</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Work Tasks"
              placeholderTextColor={COLORS.textFaint}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.workToggleRow}>
              <View>
                <Text style={styles.workToggleLabel}>Work list</Text>
                <Text style={styles.workToggleHint}>Hidden during Weekend / OOO Mode</Text>
              </View>
              <TouchableOpacity
                style={[styles.workToggleBtn, newListIsWork && styles.workToggleBtnActive]}
                onPress={() => setNewListIsWork((v) => !v)}
              >
                <Text style={[styles.workToggleBtnText, newListIsWork && styles.workToggleBtnTextActive]}>
                  {newListIsWork ? 'Work ✓' : 'Personal'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>COLOR</Text>
            <View style={styles.colorGrid}>
              {LIST_BADGE_COLORS.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.colorDot, { backgroundColor: c.bg }, i === newListColorIndex && styles.colorDotActive]}
                  onPress={() => setNewListColorIndex(i)}
                />
              ))}
            </View>
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewList(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={createList}>
              <Text style={styles.confirmBtnText}>Add list</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.bg },
  scroll:          { flex: 1 },
  content:         { padding: 20 },
  pageTitle:       { fontSize: 32, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  // Tabs
  tabScroll:       { marginHorizontal: -20, marginBottom: 20 },
  tabs:            { paddingHorizontal: 20, gap: 8 },
  tab:             { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.xl, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  tabActive:       { borderColor: COLORS.accent },
  tabBadge:        { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText:    { fontSize: 11, fontWeight: '700' },
  tabLabel:        { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  tabLabelActive:  { color: COLORS.accent, fontWeight: '600' },
  tabAdd:          { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center' },
  tabAddText:      { fontSize: 13, color: COLORS.textMuted },
  // List header
  listHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  listBadge:       { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  listBadgeText:   { fontSize: 20, fontWeight: '700' },
  listName:        { fontSize: 22, fontWeight: '700', color: COLORS.text },
  listMeta:        { fontSize: 13, color: COLORS.textMuted },
  // Add task
  addRow:              { flexDirection: 'row', gap: 10, marginBottom: 8 },
  addInput:            { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  addBtn:              { backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText:          { color: '#fff', fontWeight: '600', fontSize: 15 },
  recurRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  recurLabel:          { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  recurBtn:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
  recurBtnActive:      { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  recurBtnText:        { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  recurBtnTextActive:  { color: COLORS.accent, fontWeight: '700' },
  // Work toggle (new list modal)
  workToggleRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  workToggleLabel:     { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  workToggleHint:      { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  workToggleBtn:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  workToggleBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  workToggleBtnText:     { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  workToggleBtnTextActive: { color: COLORS.accent, fontWeight: '700' },
  // Todos
  todoList:        { gap: 8 },
  todoItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 12, ...SHADOW.card },
  todoImportant:   { borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  check:           { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkDone:       { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  checkMark:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  todoText:        { flex: 1, fontSize: 15, color: COLORS.text },
  todoTextDone:    { textDecorationLine: 'line-through', color: COLORS.textMuted },
  star:            { fontSize: 18, color: COLORS.border },
  starActive:      { color: COLORS.accent },
  recurBadge:      { fontSize: 13, color: COLORS.accent },
  deleteBtn:       { fontSize: 20, color: COLORS.textFaint, lineHeight: 22 },
  empty:           { fontSize: 14, color: COLORS.textFaint, paddingVertical: 8 },
  // Notes
  notesSection:    { marginTop: 24 },
  notesLabel:      { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  notesInput:      { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: COLORS.text, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  // Modal
  modal:           { flex: 1, backgroundColor: COLORS.bg },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:      { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalClose:      { fontSize: 18, color: COLORS.textMuted },
  modalBody:       { flex: 1, padding: 20 },
  modalFooter:     { flexDirection: 'row', gap: 12, padding: 20 },
  fieldLabel:      { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  fieldInput:      { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  colorGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot:        { width: 36, height: 36, borderRadius: 18 },
  colorDotActive:  { borderWidth: 3, borderColor: COLORS.accent },
  cancelBtn:       { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText:   { fontSize: 15, color: COLORS.textMuted, fontWeight: '500' },
  confirmBtn:      { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.accent, alignItems: 'center' },
  confirmBtnText:  { fontSize: 15, color: '#fff', fontWeight: '600' },
});
