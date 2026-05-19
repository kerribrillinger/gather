import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useApp, useTheme } from '../AppContext';
import { generateId } from '../storage';
import { RADIUS, SHADOW, LIST_BADGE_COLORS } from '../theme';

function getListBadge(name) {
  return (name || '?').charAt(0).toUpperCase();
}

export default function TasksScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [activeListId, setActiveListId] = useState(null);
  const [taskInput, setTaskInput] = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState('once');
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColorIndex, setNewListColorIndex] = useState(0);
  const [newListIsWork, setNewListIsWork] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editText, setEditText] = useState('');

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
      // Spawn recurring daily todo when marked complete
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

  function reorderTodos(newData) {
    if (!currentList) return;
    // Merge reordered open/important items back; completed items stay at bottom
    setState((s) => ({
      ...s,
      workTodos: { ...s.workTodos, [currentList.id]: newData },
    }));
  }

  function saveEditTodo() {
    if (!editText.trim() || !currentList) return;
    setState((s) => ({
      ...s,
      workTodos: {
        ...s.workTodos,
        [currentList.id]: (s.workTodos[currentList.id] || []).map((t) =>
          t.id === editingTodo.id ? { ...t, text: editText.trim() } : t
        ),
      },
    }));
    setEditingTodo(null);
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header area — everything above the draggable list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.headerContent}
        scrollEnabled={false}
        nestedScrollEnabled
      >
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
            placeholderTextColor={C.textFaint}
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
      </ScrollView>

      {/* Draggable task list */}
      {sorted.length === 0 ? (
        <Text style={[styles.empty, { paddingHorizontal: 20 }]}>No tasks yet. Add one above.</Text>
      ) : (
        <DraggableFlatList
          style={{ flex: 1 }}
          data={sorted}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => reorderTodos(data)}
          contentContainerStyle={[styles.todoList, { paddingBottom: 32 }]}
          renderItem={({ item: todo, drag, isActive }) => (
            <ScaleDecorator>
              <View style={[styles.todoItem, todo.important && !todo.completed && styles.todoImportant, isActive && styles.todoItemDragging]}>
                <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
                  <Text style={styles.dragHandleIcon}>⠿</Text>
                </TouchableOpacity>
                <Pressable style={[styles.check, todo.completed && styles.checkDone]} onPress={() => toggleTodo(todo.id)}>
                  {todo.completed && <Text style={styles.checkMark}>✓</Text>}
                </Pressable>
                <Text style={[styles.todoText, todo.completed && styles.todoTextDone]} numberOfLines={2}>{todo.text}</Text>
                {!todo.completed && (
                  <TouchableOpacity onPress={() => { setEditingTodo(todo); setEditText(todo.text); }} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 14, color: C.textFaint }}>✎</Text>
                  </TouchableOpacity>
                )}
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
            </ScaleDecorator>
          )}
        />
      )}

      {/* Notes */}
      {currentList && (
        <View style={[styles.notesSection, { paddingHorizontal: 20, paddingBottom: 20 }]}>
          <Text style={styles.notesLabel}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Jot anything down…"
            placeholderTextColor={C.textFaint}
            value={state.workNotes?.[currentList.id] || ''}
            onChangeText={(v) => setState((s) => ({
              ...s, workNotes: { ...s.workNotes, [currentList.id]: v },
            }))}
          />
        </View>
      )}

      {/* Edit Task Modal */}
      <Modal visible={!!editingTodo} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 }}>Edit Task</Text>
            <TextInput
              style={{ backgroundColor: C.bg, borderRadius: RADIUS.md, padding: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}
              value={editText}
              onChangeText={setEditText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveEditTodo}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={() => setEditingTodo(null)}>
                <Text style={{ color: C.textMuted, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' }} onPress={saveEditTodo}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              placeholderTextColor={C.textFaint}
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

function makeStyles(C) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: C.bg },
    scroll:          { flex: 0 },
    headerContent:   { paddingHorizontal: 20, paddingTop: 20 },
    pageTitle:       { fontSize: 32, fontWeight: '700', color: C.text, marginBottom: 16 },
    // Tabs
    tabScroll:       { marginHorizontal: -20, marginBottom: 20 },
    tabs:            { paddingHorizontal: 20, gap: 8 },
    tab:             { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.xl, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
    tabActive:       { borderColor: C.accent },
    tabBadge:        { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    tabBadgeText:    { fontSize: 11, fontWeight: '700' },
    tabLabel:        { fontSize: 13, fontWeight: '500', color: C.textMuted },
    tabLabelActive:  { color: C.accent, fontWeight: '600' },
    tabAdd:          { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', justifyContent: 'center' },
    tabAddText:      { fontSize: 13, color: C.textMuted },
    // List header
    listHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    listBadge:       { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    listBadgeText:   { fontSize: 20, fontWeight: '700' },
    listName:        { fontSize: 22, fontWeight: '700', color: C.text },
    listMeta:        { fontSize: 13, color: C.textMuted },
    // Add task
    addRow:              { flexDirection: 'row', gap: 10, marginBottom: 8 },
    addInput:            { flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    addBtn:              { backgroundColor: C.accent, borderRadius: RADIUS.md, paddingHorizontal: 18, justifyContent: 'center' },
    addBtnText:          { color: '#fff', fontWeight: '600', fontSize: 15 },
    recurRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    recurLabel:          { fontSize: 12, color: C.textMuted, fontWeight: '500' },
    recurBtn:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
    recurBtnActive:      { borderColor: C.accent, backgroundColor: C.accentLight },
    recurBtnText:        { fontSize: 12, color: C.textMuted, fontWeight: '500' },
    recurBtnTextActive:  { color: C.accent, fontWeight: '700' },
    // Work toggle (new list modal)
    workToggleRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
    workToggleLabel:         { fontSize: 15, color: C.text, fontWeight: '500' },
    workToggleHint:          { fontSize: 12, color: C.textMuted, marginTop: 2 },
    workToggleBtn:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
    workToggleBtnActive:     { borderColor: C.accent, backgroundColor: C.accentLight },
    workToggleBtnText:       { fontSize: 13, color: C.textMuted, fontWeight: '500' },
    workToggleBtnTextActive: { color: C.accent, fontWeight: '700' },
    // Todos
    todoList:          { gap: 8, paddingHorizontal: 20 },
    todoItem:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 12, ...SHADOW.card },
    todoImportant:     { borderLeftWidth: 3, borderLeftColor: C.accent },
    todoItemDragging:  { opacity: 0.9, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
    dragHandle:        { paddingHorizontal: 4, paddingVertical: 8 },
    dragHandleIcon:    { fontSize: 16, color: C.textFaint },
    check:             { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    checkDone:         { backgroundColor: C.sage, borderColor: C.sage },
    checkMark:         { color: '#fff', fontSize: 11, fontWeight: '700' },
    todoText:          { flex: 1, fontSize: 15, color: C.text },
    todoTextDone:      { textDecorationLine: 'line-through', color: C.textMuted },
    star:              { fontSize: 18, color: C.border },
    starActive:        { color: C.accent },
    recurBadge:        { fontSize: 13, color: C.accent },
    deleteBtn:         { fontSize: 20, color: C.textFaint, lineHeight: 22 },
    empty:             { fontSize: 14, color: C.textFaint, paddingVertical: 8 },
    // Notes
    notesSection:    { marginTop: 24 },
    notesLabel:      { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    notesInput:      { backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: C.text, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: C.border },
    // Modal
    modal:           { flex: 1, backgroundColor: C.bg },
    modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:      { fontSize: 20, fontWeight: '700', color: C.text },
    modalClose:      { fontSize: 18, color: C.textMuted },
    modalBody:       { flex: 1, padding: 20 },
    modalFooter:     { flexDirection: 'row', gap: 12, padding: 20 },
    fieldLabel:      { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    fieldInput:      { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    colorGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorDot:        { width: 36, height: 36, borderRadius: 18 },
    colorDotActive:  { borderWidth: 3, borderColor: C.accent },
    cancelBtn:       { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelBtnText:   { fontSize: 15, color: C.textMuted, fontWeight: '500' },
    confirmBtn:      { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    confirmBtnText:  { fontSize: 15, color: '#fff', fontWeight: '600' },
  });
}
