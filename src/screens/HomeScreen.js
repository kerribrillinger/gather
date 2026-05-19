import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, useTheme } from '../AppContext';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
  { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'Small steps every day lead to big results.', author: '' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomeScreen({ navigation }) {
  const { state, setState } = useApp();
  const C = useTheme();
  const [focusInput, setFocusInput] = useState('');
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  const styles = useMemo(() => makeStyles(C), [C]);

  const openTodos = (state.workLists || [])
    .filter((l) => !state.weekendMode || !l.isWork)
    .flatMap((l) => (state.workTodos[l.id] || []).filter((t) => !t.completed).map((t) => ({ ...t, listName: l.name, listId: l.id })))
    .slice(0, 5);

  const todayCheckin = (state.checkIns || []).find(
    (e) => new Date(e.createdAt).toDateString() === new Date().toDateString()
  );

  function addFocusItem() {
    const text = focusInput.trim();
    if (!text || (state.focusItems || []).length >= 3) return;
    setState((s) => ({ ...s, focusItems: [...(s.focusItems || []), { id: generateId(), text, done: false }] }));
    setFocusInput('');
  }

  function toggleFocusItem(id) {
    setState((s) => ({
      ...s,
      focusItems: (s.focusItems || []).map((f) => f.id === id ? { ...f, done: !f.done } : f),
    }));
  }

  function toggleTodo(listId, todoId) {
    setState((s) => {
      const todos = (s.workTodos[listId] || []).map((t) =>
        t.id === todoId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t
      );
      return { ...s, workTodos: { ...s.workTodos, [listId]: todos } };
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingDate}>{greeting()}, {formatDate()}</Text>
            <Text style={styles.name}>{state.userName || 'There'}</Text>
          </View>
        </View>

        {/* Quote */}
        <View style={[styles.card, styles.quoteCard]}>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          {!!quote.author && <Text style={styles.quoteAuthor}>— {quote.author}</Text>}
        </View>

        {/* Today's Top 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S TOP 3</Text>
          <View style={styles.card}>
            {(state.focusItems || []).map((item) => (
              <Pressable key={item.id} style={styles.focusRow} onPress={() => toggleFocusItem(item.id)}>
                <View style={[styles.focusCheck, item.done && styles.focusCheckDone]}>
                  {item.done && <Text style={styles.focusCheckMark}>✓</Text>}
                </View>
                <Text style={[styles.focusText, item.done && styles.focusTextDone]}>{item.text}</Text>
              </Pressable>
            ))}
            {(state.focusItems || []).length < 3 && (
              <View style={styles.focusInputRow}>
                <TextInput
                  style={styles.focusInput}
                  placeholder="Add a focus item…"
                  placeholderTextColor={C.textFaint}
                  value={focusInput}
                  onChangeText={setFocusInput}
                  onSubmitEditing={addFocusItem}
                  returnKeyType="done"
                />
              </View>
            )}
          </View>
        </View>

        {/* On Your Plate */}
        {!(state.hiddenSections || []).includes('work') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ON YOUR PLATE</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {openTodos.length === 0 ? (
                <Text style={styles.empty}>All clear — nothing on your plate.</Text>
              ) : (
                openTodos.map((t) => (
                  <Pressable key={t.id} style={styles.todoRow} onPress={() => toggleTodo(t.listId, t.id)}>
                    <View style={[styles.check, t.completed && styles.checkDone]}>
                      {t.completed && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <View style={styles.todoTextGroup}>
                      <Text style={[styles.todoText, t.completed && styles.todoTextDone]}>{t.text}</Text>
                      <Text style={styles.todoListName}>{t.listName}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        )}

        {/* Today's Check-in */}
        {!(state.hiddenSections || []).includes('checkin') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TODAY'S CHECK-IN</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Journal')}>
                <Text style={styles.seeAll}>{todayCheckin ? 'View' : 'Write one'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {todayCheckin ? (
                <Text style={styles.checkinPreview} numberOfLines={3}>{todayCheckin.body}</Text>
              ) : (
                <Text style={styles.empty}>No check-in yet today.</Text>
              )}
            </View>
          </View>
        )}

        {/* Currently Enjoying */}
        {!(state.hiddenSections || []).includes('consuming') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CURRENTLY ENJOYING</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Hobbies')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {(state.currentlyConsuming || []).filter((i) => (i.status || 'current') === 'current').length === 0 ? (
                <Text style={styles.empty}>Nothing added yet.</Text>
              ) : (
                <Text style={styles.consumingPreview}>
                  {(state.currentlyConsuming || [])
                    .filter((i) => (i.status || 'current') === 'current')
                    .slice(0, 3)
                    .map((i) => i.title)
                    .join(' · ')}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe:             { flex: 1, backgroundColor: C.bg },
    scroll:           { flex: 1 },
    content:          { padding: 20 },
    header:           { marginBottom: 20 },
    greetingDate:     { fontSize: 14, color: C.textMuted, marginBottom: 2 },
    name:             { fontSize: 36, fontWeight: '700', color: C.text },
    card:             { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, ...SHADOW.card },
    quoteCard:        { marginBottom: 24 },
    quoteText:        { fontSize: 14, fontStyle: 'italic', color: C.text, lineHeight: 22 },
    quoteAuthor:      { fontSize: 13, color: C.textMuted, marginTop: 6 },
    section:          { marginBottom: 20 },
    sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sectionTitle:     { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    seeAll:           { fontSize: 13, color: C.accent, fontWeight: '600' },
    empty:            { fontSize: 14, color: C.textFaint },
    // Focus items
    focusRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
    focusCheck:       { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    focusCheckDone:   { backgroundColor: C.sage, borderColor: C.sage },
    focusCheckMark:   { color: '#fff', fontSize: 12, fontWeight: '700' },
    focusText:        { fontSize: 14, color: C.text, flex: 1 },
    focusTextDone:    { textDecorationLine: 'line-through', color: C.textMuted },
    focusInputRow:    { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
    focusInput:       { fontSize: 14, color: C.text, paddingVertical: 4 },
    // Todos
    todoRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    check:            { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    checkDone:        { backgroundColor: C.sage, borderColor: C.sage },
    checkMark:        { color: '#fff', fontSize: 11, fontWeight: '700' },
    todoTextGroup:    { flex: 1 },
    todoText:         { fontSize: 14, color: C.text },
    todoTextDone:     { textDecorationLine: 'line-through', color: C.textMuted },
    todoListName:     { fontSize: 12, color: C.textMuted, marginTop: 1 },
    // Checkin
    checkinPreview:   { fontSize: 14, color: C.text, lineHeight: 22 },
    consumingPreview: { fontSize: 14, color: C.text },
  });
}
