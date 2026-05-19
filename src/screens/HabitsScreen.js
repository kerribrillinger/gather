import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { generateId } from '../storage';
import { COLORS, RADIUS, SHADOW } from '../theme';

const FREQ_OPTIONS = [
  { key: 'daily',   label: 'Daily'   },
  { key: 'weekday', label: 'Weekdays' },
  { key: 'weekly',  label: 'Weekly'  },
];

function todayKey() {
  return new Date().toDateString();
}

function getStreak(habitId, habitLog) {
  const log = habitLog[habitId] || {};
  let streak = 0;
  const d = new Date();
  // Walk backwards from yesterday (today may or may not be checked)
  d.setDate(d.getDate() - 1);
  while (log[d.toDateString()]) {
    streak += 1;
    d.setDate(d.getDate() - 1);
    if (streak > 365) break; // safety cap
  }
  // Include today if checked
  if (log[todayKey()]) streak += 1;
  return streak;
}

export default function HabitsScreen() {
  const { state, setState } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFreq, setNewFreq] = useState('daily');
  const [newEmoji, setNewEmoji] = useState('⭐');

  const habits = state.habits || [];
  const today = todayKey();

  function toggleHabit(habitId) {
    setState((s) => {
      const log = s.habitLog || {};
      const dayLog = { ...(log[habitId] || {}) };
      if (dayLog[today]) {
        delete dayLog[today];
      } else {
        dayLog[today] = true;
      }
      return { ...s, habitLog: { ...log, [habitId]: dayLog } };
    });
  }

  function addHabit() {
    const name = newName.trim();
    if (!name) return;
    const habit = {
      id: generateId(),
      name,
      emoji: newEmoji,
      frequency: newFreq,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, habits: [...(s.habits || []), habit] }));
    setNewName('');
    setNewFreq('daily');
    setNewEmoji('⭐');
    setShowAdd(false);
  }

  function deleteHabit(id) {
    setState((s) => {
      const newLog = { ...(s.habitLog || {}) };
      delete newLog[id];
      return { ...s, habits: (s.habits || []).filter((h) => h.id !== id), habitLog: newLog };
    });
  }

  const completedToday = habits.filter((h) => !!(state.habitLog?.[h.id]?.[today])).length;
  const totalToday = habits.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Habits</Text>
            <Text style={styles.pageSubtitle}>Daily momentum</Text>
          </View>
          <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addHeaderBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Daily progress bar */}
        {totalToday > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Today's progress</Text>
              <Text style={styles.progressCount}>{completedToday} / {totalToday}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((completedToday / totalToday) * 100)}%` }]} />
            </View>
            {completedToday === totalToday && totalToday > 0 && (
              <Text style={styles.allDone}>All done today! 🎉</Text>
            )}
          </View>
        )}

        {/* Habit list */}
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyHint}>Add a habit to start building daily momentum</Text>
          </View>
        ) : (
          <View style={styles.habitList}>
            {habits.map((habit) => {
              const done = !!(state.habitLog?.[habit.id]?.[today]);
              const streak = getStreak(habit.id, state.habitLog || {});
              return (
                <View key={habit.id} style={[styles.habitRow, done && styles.habitRowDone]}>
                  <Pressable style={[styles.circle, done && styles.circleDone]} onPress={() => toggleHabit(habit.id)}>
                    {done && <Text style={styles.circleCheck}>✓</Text>}
                  </Pressable>
                  <View style={styles.habitInfo}>
                    <View style={styles.habitTitleRow}>
                      <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                      <Text style={[styles.habitName, done && styles.habitNameDone]}>{habit.name}</Text>
                    </View>
                    <Text style={styles.habitMeta}>
                      {FREQ_OPTIONS.find((f) => f.key === habit.frequency)?.label || 'Daily'}
                      {streak > 0 ? ` · 🔥 ${streak} day${streak !== 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteHabit(habit.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Habit</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>HABIT NAME</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Morning walk, Read 20 min…"
              placeholderTextColor={COLORS.textFaint}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>EMOJI</Text>
            <View style={styles.emojiGrid}>
              {['⭐','💪','📚','🏃','🧘','💧','🥗','😴','✏️','🎯','🌿','🎵'].map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, newEmoji === e && styles.emojiBtnActive]}
                  onPress={() => setNewEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>FREQUENCY</Text>
            <View style={styles.freqRow}>
              {FREQ_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.freqBtn, newFreq === f.key && styles.freqBtnActive]}
                  onPress={() => setNewFreq(f.key)}
                >
                  <Text style={[styles.freqBtnText, newFreq === f.key && styles.freqBtnTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={addHabit}>
              <Text style={styles.confirmBtnText}>Add habit</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: COLORS.bg },
  scroll:            { flex: 1 },
  content:           { padding: 20 },
  pageHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle:         { fontSize: 32, fontWeight: '700', color: COLORS.text },
  pageSubtitle:      { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  addHeaderBtn:      { backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, marginTop: 6 },
  addHeaderBtnText:  { color: '#fff', fontWeight: '600', fontSize: 14 },
  // Progress
  progressCard:      { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 16, marginBottom: 20, ...SHADOW.card },
  progressTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:     { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  progressCount:     { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  progressTrack:     { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill:      { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },
  allDone:           { fontSize: 13, color: COLORS.sage, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  // Empty
  emptyState:        { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:         { fontSize: 40, marginBottom: 12 },
  emptyTitle:        { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  emptyHint:         { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', maxWidth: 240 },
  // Habit rows
  habitList:         { gap: 10 },
  habitRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.card },
  habitRowDone:      { opacity: 0.75 },
  circle:            { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  circleDone:        { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  circleCheck:       { color: '#fff', fontSize: 14, fontWeight: '700' },
  habitInfo:         { flex: 1 },
  habitTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  habitEmoji:        { fontSize: 18 },
  habitName:         { fontSize: 15, fontWeight: '600', color: COLORS.text },
  habitNameDone:     { textDecorationLine: 'line-through', color: COLORS.textMuted },
  habitMeta:         { fontSize: 12, color: COLORS.textMuted },
  deleteBtn:         { padding: 4 },
  deleteBtnText:     { fontSize: 20, color: COLORS.textFaint, lineHeight: 22 },
  // Modal
  modal:             { flex: 1, backgroundColor: COLORS.bg },
  modalHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:        { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalClose:        { fontSize: 18, color: COLORS.textMuted },
  modalBody:         { flex: 1, padding: 20 },
  modalFooter:       { flexDirection: 'row', gap: 12, padding: 20 },
  fieldLabel:        { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  fieldInput:        { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  emojiGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn:          { width: 46, height: 46, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgCard },
  emojiBtnActive:    { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  emojiText:         { fontSize: 22 },
  freqRow:           { flexDirection: 'row', gap: 10 },
  freqBtn:           { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bgCard },
  freqBtnActive:     { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  freqBtnText:       { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  freqBtnTextActive: { color: COLORS.accent, fontWeight: '700' },
  cancelBtn:         { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText:     { fontSize: 15, color: COLORS.textMuted, fontWeight: '500' },
  confirmBtn:        { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.accent, alignItems: 'center' },
  confirmBtnText:    { fontSize: 15, color: '#fff', fontWeight: '600' },
});
