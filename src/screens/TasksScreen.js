import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../BottomSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import { generateId } from '../storage';
import { RADIUS, SHADOW, LIST_BADGE_COLORS } from '../theme';

// Fixed due-date chip colours — not theme-dependent
const DUE_COLORS = {
  overdueBg:   'rgba(200,80,50,0.12)',
  overdueText: '#C85032',
  todayBg:     'rgba(200,130,50,0.12)',
  todayText:   '#C87832',
  tomorrowBg:  'rgba(196,154,42,0.12)',
};

// Returns the emoji icon or first letter for a list badge
function getListBadge(list) {
  if (list?.icon) return list.icon;
  return (list?.name || '?').charAt(0).toUpperCase();
}

function formatDueDate(isoString) {
  if (!isoString) return null;
  const dueDate = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueDateString = dueDate.toDateString();
  const todayString = today.toDateString();
  const tomorrowString = tomorrow.toDateString();

  const dateFormatter = new Intl.DateTimeFormat('en-AU', { month: 'short', day: 'numeric' });
  const formattedDate = dateFormatter.format(dueDate);

  if (dueDateString === todayString) return `${formattedDate} · Today`;
  if (dueDateString === tomorrowString) return `${formattedDate} · Tomorrow`;
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  if (dueDate < todayMidnight) return `${formattedDate} · Overdue`;
  return formattedDate;
}

// Returns { bg, text } for due-date chip styling
function getDueDateChipStyle(isoString, C) {
  if (!isoString) return { bg: C.border, text: C.textMuted };
  const dueDate = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDateString = dueDate.toDateString();
  const todayString = today.toDateString();
  const tomorrowString = tomorrow.toDateString();

  if (dueDate < today && dueDateString !== todayString) {
    // Overdue
    return { bg: DUE_COLORS.overdueBg, text: DUE_COLORS.overdueText };
  }
  if (dueDateString === todayString) {
    // Today
    return { bg: DUE_COLORS.todayBg, text: DUE_COLORS.todayText };
  }
  if (dueDateString === tomorrowString) {
    // Tomorrow
    return { bg: DUE_COLORS.tomorrowBg, text: C.accent };
  }
  // Upcoming
  return { bg: C.border, text: C.textMuted };
}

export default function TasksScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const showAlert = useAlert();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [activeListId, setActiveListId] = useState(null);
  const [taskInput, setTaskInput] = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState('once');
  const [taskDueDate, setTaskDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColorIndex, setNewListColorIndex] = useState(0);
  const [newListIsWork, setNewListIsWork] = useState(false);
  const [newListIcon, setNewListIcon] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTodoNotes, setEditTodoNotes] = useState('');
  const [editTodoDueDate, setEditTodoDueDate] = useState(null);
  const [editTodoImportant, setEditTodoImportant] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [editListName, setEditListName] = useState('');
  const [editListColorIndex, setEditListColorIndex] = useState(0);
  const [editListIsWork, setEditListIsWork] = useState(false);
  const [editListIcon, setEditListIcon] = useState('');
  // Completed section starts collapsed
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const allLists = state.workLists || [];
  const lists = state.weekendMode ? allLists.filter((l) => !l.isWork) : allLists;
  const currentList = lists.find((l) => l.id === activeListId) || lists[0];
  const todos = currentList ? (state.workTodos[currentList.id] || []) : [];

  const openTodos = [
    ...todos.filter((t) => !t.completed && t.important),
    ...todos.filter((t) => !t.completed && !t.important),
  ];
  const completedTodos = todos.filter((t) => t.completed);

  function addTodo() {
    const text = taskInput.trim();
    const listId = currentList?.id;
    if (!text || !listId) return;
    const newTodo = {
      id: generateId(), text, completed: false,
      createdAt: new Date().toISOString(), completedAt: null,
      dueDate: taskDueDate, notes: '', important: false, recurrence: taskRecurrence,
    };
    setState((s) => ({
      ...s,
      workTodos: { ...s.workTodos, [listId]: [newTodo, ...(s.workTodos[listId] || [])] },
    }));
    setTaskInput('');
    setTaskRecurrence('once');
    setTaskDueDate(null);
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
    const todo = (state.workTodos[currentList.id] || []).find((t) => t.id === id);
    if (!todo) return;
    const taskText = todo.text.length > 50 ? todo.text.substring(0, 47) + '…' : todo.text;
    showAlert({
      title: 'Delete task',
      message: `"${taskText}" will be deleted. This cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setState((s) => ({
              ...s,
              workTodos: {
                ...s.workTodos,
                [currentList.id]: (s.workTodos[currentList.id] || []).filter((t) => t.id !== id),
              },
            }));
          },
        },
      ],
    });
  }

  function saveEditTodo() {
    if (!editText.trim() || !currentList) return;
    setState((s) => ({
      ...s,
      workTodos: {
        ...s.workTodos,
        [currentList.id]: (s.workTodos[currentList.id] || []).map((t) =>
          t.id === editingTodo.id
            ? { ...t, text: editText.trim(), dueDate: editTodoDueDate, notes: editTodoNotes, important: editTodoImportant, recurrence: t.recurrence }
            : t
        ),
      },
    }));
    setEditingTodo(null);
    setEditTodoDueDate(null);
    setEditTodoNotes('');
    setEditTodoImportant(false);
    showToast('Task updated');
  }

  function deleteEditingTodo() {
    if (!editingTodo) return;
    const id = editingTodo.id;
    setEditingTodo(null);
    deleteTodo(id);
  }

  function createList() {
    const name = newListName.trim();
    if (!name) return;
    const newId = 'list-' + Date.now();
    setState((s) => ({
      ...s,
      workLists: [
        ...(s.workLists || []),
        { id: newId, name, colorIndex: newListColorIndex, isWork: newListIsWork, icon: newListIcon.trim() || null },
      ],
      workTodos: { ...s.workTodos, [newId]: [] },
      workNotes: { ...s.workNotes, [newId]: '' },
    }));
    setActiveListId(newId);
    setNewListName('');
    setNewListColorIndex(0);
    setNewListIsWork(false);
    setNewListIcon('');
    setShowNewList(false);
    showToast('List created');
  }

  function saveEditList() {
    const name = editListName.trim();
    if (!name || !editingList) return;
    setState((s) => ({
      ...s,
      workLists: (s.workLists || []).map((l) =>
        l.id === editingList.id
          ? { ...l, name, colorIndex: editListColorIndex, isWork: editListIsWork, icon: editListIcon.trim() || null }
          : l
      ),
    }));
    setEditingList(null);
    showToast('List updated');
  }

  function deleteList() {
    if (!editingList) return;
    showAlert({
      title: 'Delete list',
      message: `Are you sure you want to delete "${editingList.name}"? All tasks in this list will be deleted.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setState((s) => {
              const newTodos = { ...s.workTodos };
              const newNotes = { ...s.workNotes };
              delete newTodos[editingList.id];
              delete newNotes[editingList.id];
              return {
                ...s,
                workLists: (s.workLists || []).filter((l) => l.id !== editingList.id),
                workTodos: newTodos,
                workNotes: newNotes,
              };
            });
            if (activeListId === editingList.id) setActiveListId(null);
            setEditingList(null);
          },
        },
      ],
    });
  }

  async function copyNotes() {
    const notes = state.workNotes?.[currentList?.id] || '';
    await Clipboard.setStringAsync(notes);
    showToast('Notes copied');
  }

  const color = currentList ? LIST_BADGE_COLORS[currentList.colorIndex ?? 0] : LIST_BADGE_COLORS[0];
  const openCount = openTodos.length;
  const doneCount = completedTodos.length;

  function renderTodoRow(todo) {
    const chipStyle = getDueDateChipStyle(todo.dueDate, C);
    return (
      <View key={todo.id} style={[
        styles.todoItem,
        todo.important && !todo.completed && styles.todoImportant,
      ]}>
          <Pressable style={[styles.check, todo.completed && styles.checkDone]} onPress={() => toggleTodo(todo.id)}>
            {todo.completed && <Text style={styles.checkMark}>✓</Text>}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.todoText, todo.completed && styles.todoTextDone]} numberOfLines={2}>{todo.text}</Text>
            {todo.dueDate && (
              <View style={[styles.dueDateChipContainer, { backgroundColor: chipStyle.bg }]}>
                <Text style={[styles.dueDateChipText, { color: chipStyle.text }]} numberOfLines={1}>
                  {formatDueDate(todo.dueDate)}
                </Text>
              </View>
            )}
            {todo.notes ? (
              <Text style={[styles.todoNotes, todo.completed && styles.todoNotesDone]} numberOfLines={1}>
                {todo.notes}
              </Text>
            ) : null}
          </View>
          {!todo.completed && (
            <TouchableOpacity
              onPress={() => {
                setEditingTodo(todo);
                setEditText(todo.text);
                setEditTodoDueDate(todo.dueDate);
                setEditTodoNotes(todo.notes || '');
                setEditTodoImportant(todo.important || false);
              }}
              style={{ padding: 4 }}
            >
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
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {lists.length === 0 ? (
        <View style={styles.noListsState}>
          <Text style={styles.noListsIcon}>📋</Text>
          <Text style={styles.noListsTitle}>No lists yet</Text>
          <Text style={styles.noListsHint}>Organise your tasks into lists{'\n'}to get started</Text>
          <TouchableOpacity style={[styles.noListsCta, { backgroundColor: C.accent }]} onPress={() => setShowNewList(true)}>
            <Text style={[styles.noListsCtaText, { fontFamily: F.heading }]}>Create a list</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.mainContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Page title */}
          <Text style={styles.pageTitle}>Tasks</Text>

          {/* List tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabs}>
            {lists.map((list) => {
              const isActive = list.id === (currentList?.id);
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveListId(list.id)}
                >
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{list.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active list header */}
          {currentList && (
            <View style={styles.listHeader}>
              <View style={[styles.listBadge, { backgroundColor: color.bg }]}>
                <Text style={[styles.listBadgeText, { color: color.text }]}>{getListBadge(currentList)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{currentList.name}</Text>
                <Text style={styles.listMeta}>
                  {openCount > 0 ? `${openCount} open · ${doneCount} done` : doneCount > 0 ? `All ${doneCount} done` : 'No tasks yet'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditingList(currentList);
                  setEditListName(currentList.name);
                  setEditListColorIndex(currentList.colorIndex ?? 0);
                  setEditListIsWork(currentList.isWork ?? false);
                  setEditListIcon(currentList.icon || '');
                }}
                style={{ padding: 4 }}
              >
                <Text style={{ fontSize: 18, color: C.textMuted }}>⋯</Text>
              </TouchableOpacity>
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
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateBtnText}>📅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {taskDueDate && (
            <View style={styles.dueDateRow}>
              <Text style={styles.dueDateLabel}>Due: {formatDueDate(taskDueDate)}</Text>
              <TouchableOpacity onPress={() => setTaskDueDate(null)}>
                <Text style={styles.dueDateClear}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
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

          {/* Open tasks */}
          {openTodos.length === 0 && completedTodos.length === 0 ? (
            <Text style={styles.empty}>No tasks yet. Add one above.</Text>
          ) : (
            <View style={styles.todoList}>
              {openTodos.map((todo) => renderTodoRow(todo))}
            </View>
          )}

          {/* Completed section */}
          {completedTodos.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.completedHeader}
                onPress={() => setCompletedExpanded((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.completedChevron}>{completedExpanded ? '▼' : '▶'}</Text>
                <Text style={styles.completedLabel}>COMPLETED</Text>
                <View style={styles.completedCount}>
                  <Text style={styles.completedCountText}>{completedTodos.length}</Text>
                </View>
              </TouchableOpacity>
              {completedExpanded && (
                <View style={styles.todoList}>
                  {completedTodos.map((todo) => renderTodoRow(todo))}
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          {currentList && (
            <View style={styles.notesSection}>
              <View style={styles.notesHeaderRow}>
                <Text style={styles.notesLabel}>NOTES</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyNotes}>
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
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

          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Date Picker for New Task */}
      {showDatePicker && (
        <DateTimePicker
          value={taskDueDate ? new Date(taskDueDate) : new Date()}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            if (date && event.type === 'set') {
              setTaskDueDate(date.toISOString());
              setShowDatePicker(false);
            } else if (event.type === 'dismissed') {
              setShowDatePicker(false);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {/* Edit Task — Bottom Sheet */}
      <BottomSheet visible={!!editingTodo} onClose={() => setEditingTodo(null)} backgroundColor={C.bgCard}>
        <Text style={styles.bottomSheetTitle}>Edit Task</Text>
        <TextInput
          style={styles.editTaskInput}
          value={editText}
          onChangeText={setEditText}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={saveEditTodo}
        />
        {/* Notes field */}
        <Text style={styles.editFieldLabel}>NOTES</Text>
        <TextInput
          style={styles.editNotesInput}
          value={editTodoNotes}
          onChangeText={setEditTodoNotes}
          multiline
          placeholder="Add notes…"
          placeholderTextColor={C.textFaint}
          returnKeyType="default"
        />
        {/* Due date */}
        {editTodoDueDate && (
          <View style={styles.editDueDateRow}>
            <Text style={{ fontSize: 14, color: getDueDateChipStyle(editTodoDueDate, C).text, fontFamily: F.body }}>
              Due: {formatDueDate(editTodoDueDate)}
            </Text>
            <TouchableOpacity onPress={() => setEditTodoDueDate(null)}>
              <Text style={{ fontSize: 16, color: C.textMuted }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.editChangeDateBtn}
          onPress={() => setShowEditDatePicker(true)}
        >
          <Text style={{ color: C.accent, fontFamily: F.body }}>📅 Change Due Date</Text>
        </TouchableOpacity>
        {/* Mark as important toggle */}
        <View style={styles.importantToggleRow}>
          <Text style={styles.importantToggleLabel}>⭐️ Mark as important</Text>
          <Switch
            value={editTodoImportant}
            onValueChange={setEditTodoImportant}
            trackColor={{ false: C.border, true: C.accentLight }}
            thumbColor={editTodoImportant ? C.accent : C.textFaint}
          />
        </View>
        {/* Footer: Delete (left, danger) + Save (right, accent) */}
        <View style={styles.editFooter}>
          <TouchableOpacity style={styles.editDeleteBtn} onPress={deleteEditingTodo}>
            <Text style={styles.editDeleteBtnText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editSaveBtn} onPress={saveEditTodo}>
            <Text style={styles.editSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Date Picker for Edit Task */}
      {showEditDatePicker && (
        <DateTimePicker
          value={editTodoDueDate ? new Date(editTodoDueDate) : new Date()}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            if (date && event.type === 'set') {
              setEditTodoDueDate(date.toISOString());
              setShowEditDatePicker(false);
            } else if (event.type === 'dismissed') {
              setShowEditDatePicker(false);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {/* FAB — new list */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: C.accent }]} onPress={() => setShowNewList(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* New List — BottomSheet */}
      <BottomSheet visible={showNewList} onClose={() => setShowNewList(false)} backgroundColor={C.bg} fullHeight>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>New List</Text>
          <TouchableOpacity
            style={[styles.sheetSaveBtn, !newListName.trim() && { opacity: 0.4 }]}
            onPress={createList}
            disabled={!newListName.trim()}
          >
            <Text style={styles.sheetSaveBtnText}>Add list</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>LIST NAME</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Work Tasks"
            placeholderTextColor={C.textFaint}
            value={newListName}
            onChangeText={setNewListName}
            autoFocus
          />
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>ICON (EMOJI)</Text>
          <TextInput
            style={[styles.fieldInput, { fontSize: 22, textAlign: 'center', letterSpacing: 4 }]}
            placeholder="e.g. 🏠"
            placeholderTextColor={C.textFaint}
            value={newListIcon}
            onChangeText={(v) => setNewListIcon(v.slice(-2))}
            maxLength={2}
          />
          <View style={[styles.workToggleRow, { marginTop: 16 }]}>
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
          <TouchableOpacity
            style={[styles.addListBtn, !newListName.trim() && { opacity: 0.4 }]}
            onPress={createList}
            disabled={!newListName.trim()}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addListBtnText}>Add list</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      {/* Edit List — BottomSheet */}
      <BottomSheet visible={!!editingList} onClose={() => setEditingList(null)} backgroundColor={C.bg} fullHeight>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Edit List</Text>
          <TouchableOpacity style={styles.sheetSaveBtn} onPress={saveEditList}>
            <Text style={styles.sheetSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>LIST NAME</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Work Tasks"
            placeholderTextColor={C.textFaint}
            value={editListName}
            onChangeText={setEditListName}
            autoFocus
          />
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>ICON (EMOJI)</Text>
          <TextInput
            style={[styles.fieldInput, { fontSize: 22, textAlign: 'center', letterSpacing: 4 }]}
            placeholder="e.g. 🏠"
            placeholderTextColor={C.textFaint}
            value={editListIcon}
            onChangeText={(v) => setEditListIcon(v.slice(-2))}
            maxLength={2}
          />
          <View style={[styles.workToggleRow, { marginTop: 16 }]}>
            <View>
              <Text style={styles.workToggleLabel}>Work list</Text>
              <Text style={styles.workToggleHint}>Hidden during Weekend / OOO Mode</Text>
            </View>
            <TouchableOpacity
              style={[styles.workToggleBtn, editListIsWork && styles.workToggleBtnActive]}
              onPress={() => setEditListIsWork((v) => !v)}
            >
              <Text style={[styles.workToggleBtnText, editListIsWork && styles.workToggleBtnTextActive]}>
                {editListIsWork ? 'Work ✓' : 'Personal'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>COLOR</Text>
          <View style={styles.colorGrid}>
            {LIST_BADGE_COLORS.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.colorDot, { backgroundColor: c.bg }, i === editListColorIndex && styles.colorDotActive]}
                onPress={() => setEditListColorIndex(i)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.deleteListBtn} onPress={deleteList}>
            <Text style={styles.deleteListBtnText}>Delete this list…</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: C.bg },
    mainContent:     { paddingHorizontal: 20, paddingTop: 12 },
    pageTitle:       { fontSize: 22, fontFamily: F.heading, color: C.text, marginBottom: 10 },
    noListsState:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
    noListsIcon:     { fontSize: 48, marginBottom: 16 },
    noListsTitle:    { fontSize: 18, fontFamily: F.heading, color: C.text, marginBottom: 8 },
    noListsHint:     { fontSize: 14, color: C.textMuted, fontFamily: F.body, textAlign: 'center', lineHeight: 22 },
    noListsCta:      { marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
    noListsCtaText:  { fontSize: 15, color: '#fff' },
    // Tabs
    tabScroll:       { marginHorizontal: -20, marginBottom: 10 },
    tabs:            { paddingHorizontal: 20, gap: 8 },
    tab:             { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
    tabActive:       { backgroundColor: C.accentLight, borderColor: C.accent },
    tabLabel:        { fontSize: 13, fontFamily: F.body, color: C.textMuted },
    tabLabelActive:  { color: C.accent, fontFamily: F.heading },
    // List header
    listHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    listBadge:       { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    listBadgeText:   { fontSize: 20, fontFamily: F.heading },
    listName:        { fontSize: 22, fontFamily: F.heading, color: C.text },
    listMeta:        { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    // Add task
    addRow:              { flexDirection: 'row', gap: 10, marginBottom: 8 },
    addInput:            { flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    dateBtn:             { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    dateBtnText:         { fontSize: 16 },
    addBtn:              { backgroundColor: C.accent, borderRadius: RADIUS.md, paddingHorizontal: 18, justifyContent: 'center' },
    addBtnText:          { color: '#fff', fontFamily: F.heading, fontSize: 15 },
    dueDateRow:          { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    dueDateLabel:        { fontSize: 12, color: C.accent, fontFamily: F.body, flex: 1 },
    dueDateClear:        { fontSize: 16, color: C.textMuted, fontFamily: F.body },
    // Due date chip with pill background
    dueDateChipContainer: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    dueDateChipText:      { fontSize: 11, fontFamily: F.body },
    recurRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    recurLabel:          { fontSize: 12, color: C.textMuted, fontFamily: F.body },
    recurBtn:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
    recurBtnActive:      { borderColor: C.accent, backgroundColor: C.accentLight },
    recurBtnText:        { fontSize: 12, color: C.textMuted, fontFamily: F.body },
    recurBtnTextActive:  { color: C.accent, fontFamily: F.heading },
    // Work toggle (list modals)
    workToggleRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
    workToggleLabel:         { fontSize: 15, color: C.text, fontFamily: F.body },
    workToggleHint:          { fontSize: 12, color: C.textMuted, marginTop: 2, fontFamily: F.body },
    workToggleBtn:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
    workToggleBtnActive:     { borderColor: C.accent, backgroundColor: C.accentLight },
    workToggleBtnText:       { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    workToggleBtnTextActive: { color: C.accent, fontFamily: F.heading },
    // Todos
    todoList:          { gap: 8 },
    todoItem:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 12, ...SHADOW.card },
    // Priority tasks use full border accent
    todoImportant:     { borderColor: C.accent, borderWidth: 1.5 },
    // Checkbox: 18×18, borderRadius 4, gold when checked
    check:             { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    checkDone:         { backgroundColor: C.accent, borderColor: C.accent },
    checkMark:         { color: '#fff', fontSize: 10, fontFamily: F.heading },
    todoText:          { flex: 1, fontSize: 14, color: C.text, fontFamily: F.body },
    todoTextDone:      { textDecorationLine: 'line-through', color: C.textMuted },
    todoNotes:         { fontSize: 11, color: C.textMuted, marginTop: 2, fontFamily: F.italic || F.body },
    todoNotesDone:     { color: C.textFaint },
    star:              { fontSize: 13, color: C.border },
    starActive:        { color: C.accent },
    recurBadge:        { fontSize: 13, color: C.accent },
    deleteBtn:         { fontSize: 20, color: C.textFaint, lineHeight: 22 },
    empty:             { fontSize: 14, color: C.textFaint, paddingVertical: 8, paddingHorizontal: 20, fontFamily: F.body },
    // Completed section
    completedHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    completedChevron:    { fontSize: 10, color: C.textFaint },
    completedLabel:      { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8 },
    completedCount:      { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
    completedCountText:  { fontSize: 11, color: C.textFaint, fontFamily: F.body },
    // Notes
    notesSection:    { marginTop: 20 },
    notesHeaderRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    notesLabel:      { fontSize: 11, fontFamily: F.heading, color: C.textMuted, letterSpacing: 0.8 },
    notesInput:      { backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: C.text, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    copyBtn:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, backgroundColor: C.border },
    copyBtnText:     { fontSize: 11, color: C.textMuted, fontFamily: F.body },
    // Edit task bottom sheet
    bottomSheetTitle:    { fontSize: 16, fontFamily: F.heading, color: C.text, marginBottom: 12 },
    editTaskInput:       { backgroundColor: C.bg, borderRadius: RADIUS.md, padding: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 12, fontFamily: F.body },
    editFieldLabel:      { fontSize: 11, fontFamily: F.heading, color: C.textMuted, letterSpacing: 0.8, marginBottom: 6 },
    editNotesInput:      { backgroundColor: C.bg, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 12, minHeight: 72, textAlignVertical: 'top', fontFamily: F.body },
    editDueDateRow:      { backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.border },
    editChangeDateBtn:   { backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    importantToggleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 16 },
    importantToggleLabel: { fontSize: 15, color: C.text, fontFamily: F.body },
    editFooter:          { flexDirection: 'row', gap: 10 },
    editDeleteBtn:       { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#FAD4D4', alignItems: 'center', justifyContent: 'center' },
    editDeleteBtnText:   { fontSize: 14, color: C.danger, fontFamily: F.body },
    editSaveBtn:         { flex: 1, padding: 12, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    editSaveBtnText:     { color: '#fff', fontFamily: F.heading },
    // Modal
    fab:             { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    sheetHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
    sheetTitle:      { fontSize: 18, fontFamily: F.heading, color: C.text },
    sheetSaveBtn:    { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.md },
    sheetSaveBtnText:{ color: '#fff', fontFamily: F.heading, fontSize: 14 },
    sheetBody:       { paddingBottom: 60 },
    addListBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, marginBottom: 12, backgroundColor: C.accent, paddingVertical: 14, borderRadius: RADIUS.md },
    addListBtnText:  { fontSize: 15, color: '#fff', fontFamily: F.heading },
    deleteListBtn:   { marginTop: 32, paddingVertical: 14, alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#FAD4D4' },
    deleteListBtnText:{ fontSize: 15, color: C.danger, fontFamily: F.body },
    fieldLabel:      { fontSize: 11, fontFamily: F.heading, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    fieldInput:      { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    colorGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorDot:        { width: 36, height: 36, borderRadius: 18 },
    colorDotActive:  { borderWidth: 3, borderColor: C.accent },
  });
}
