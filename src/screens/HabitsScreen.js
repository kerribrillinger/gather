import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, useTheme, useFont } from '../AppContext';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

const FREQ_OPTIONS = [
  { key: 'daily',   label: 'Daily'   },
  { key: 'weekday', label: 'Weekdays' },
  { key: 'weekly',  label: 'Weekly'  },
];

const EMOJI_CATEGORIES = {
  'Wellness':  ['🧘', '🏃', '💪', '🚴', '⛹️', '🏊', '🧗', '🤸'],
  'Nutrition': ['🥗', '🥕', '🍎', '🥤', '🍵', '☕', '🥛', '🍚'],
  'Sleep':     ['😴', '🛏️', '🌙', '💤', '🌛', '🛌', '😇', '✨'],
  'Learning':  ['📚', '📖', '✏️', '📝', '💭', '🧠', '🎓', '📺'],
  'Creativity': ['🎨', '🎭', '🎬', '🎵', '🎸', '✒️', '🖌️', '📸'],
  'Social':    ['👥', '💬', '☎️', '📞', '🤝', '💌', '🎉', '🤗'],
  'Work':      ['💼', '💻', '⏰', '📊', '🎯', '📋', '🔥', '💡'],
  'Fun':       ['⭐', '🎮', '🎲', '🎯', '🏆', '🎊', '🎁', '😄'],
};

function todayKey() {
  return new Date().toDateString();
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getStreak(habitId, habitLog, frequency) {
  const log = habitLog[habitId] || {};
  let streak = 0;
  const d = new Date();
  // Walk backwards from yesterday (today may or may not be checked)
  d.setDate(d.getDate() - 1);
  while (streak <= 365) {
    // Weekday habits skip weekend days — a gap over the weekend doesn't break the streak
    if (frequency === 'weekday' && isWeekend(d)) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    if (!log[d.toDateString()]) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  // Include today if checked (skip if today is a weekend and habit is weekday-only)
  const todayIsApplicable = frequency !== 'weekday' || !isWeekend(new Date());
  if (todayIsApplicable && log[todayKey()]) streak += 1;
  return streak;
}

export default function HabitsScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFreq, setNewFreq] = useState('daily');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const [editingHabit, setEditingHabit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFreq, setEditFreq] = useState('daily');
  const [editEmoji, setEditEmoji] = useState('⭐');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // 'add' or 'edit'

  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

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

  function saveEditHabit() {
    if (!editName.trim()) return;
    setState((s) => ({
      ...s,
      habits: (s.habits || []).map((h) =>
        h.id === editingHabit.id ? { ...h, name: editName.trim(), emoji: editEmoji, frequency: editFreq } : h
      ),
    }));
    setEditingHabit(null);
  }

  const todayIsWeekend = isWeekend(new Date());
  const applicableHabits = habits.filter((h) => !(h.frequency === 'weekday' && todayIsWeekend));
  const completedToday = applicableHabits.filter((h) => !!(state.habitLog?.[h.id]?.[today])).length;
  const totalToday = applicableHabits.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
              const isWeekdayHabitOnWeekend = habit.frequency === 'weekday' && isWeekend(new Date());
              const done = !!(state.habitLog?.[habit.id]?.[today]);
              const streak = getStreak(habit.id, state.habitLog || {}, habit.frequency);
              return (
                <View key={habit.id} style={[styles.habitRow, done && styles.habitRowDone, isWeekdayHabitOnWeekend && styles.habitRowMuted]}>
                  <Pressable style={[styles.circle, done && styles.circleDone]} onPress={() => !isWeekdayHabitOnWeekend && toggleHabit(habit.id)}>
                    {done && <Text style={styles.circleCheck}>✓</Text>}
                  </Pressable>
                  <View style={styles.habitInfo}>
                    <View style={styles.habitTitleRow}>
                      <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                      <Text style={[styles.habitName, done && styles.habitNameDone]}>{habit.name}</Text>
                    </View>
                    <Text style={styles.habitMeta}>
                      {FREQ_OPTIONS.find((f) => f.key === habit.frequency)?.label || 'Daily'}
                      {isWeekdayHabitOnWeekend ? ' · rest day' : streak > 0 ? ` · 🔥 ${streak} day${streak !== 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity onPress={() => { setEditingHabit(habit); setEditName(habit.name); setEditEmoji(habit.emoji); setEditFreq(habit.frequency); }} style={styles.deleteBtn}>
                      <Text style={{ fontSize: 16, color: C.textMuted }}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteHabit(habit.id)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Habit Modal */}
      <Modal visible={!!editingHabit} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Habit</Text>
            <TouchableOpacity onPress={() => setEditingHabit(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>HABIT NAME</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Morning walk, Read 20 min…"
              placeholderTextColor={C.textFaint}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>EMOJI</Text>
            <TouchableOpacity style={styles.emojiPickerBtn} onPress={() => setShowEmojiPicker('edit')}>
              <Text style={styles.emojiPickerEmoji}>{editEmoji}</Text>
              <Text style={styles.emojiPickerText}>Choose emoji →</Text>
            </TouchableOpacity>
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>FREQUENCY</Text>
            <View style={styles.freqRow}>
              {FREQ_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.freqBtn, editFreq === f.key && styles.freqBtnActive]}
                  onPress={() => setEditFreq(f.key)}
                >
                  <Text style={[styles.freqBtnText, editFreq === f.key && styles.freqBtnTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingHabit(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={saveEditHabit}>
              <Text style={styles.confirmBtnText}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
              placeholderTextColor={C.textFaint}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>EMOJI</Text>
            <TouchableOpacity style={styles.emojiPickerBtn} onPress={() => setShowEmojiPicker('add')}>
              <Text style={styles.emojiPickerEmoji}>{newEmoji}</Text>
              <Text style={styles.emojiPickerText}>Choose emoji →</Text>
            </TouchableOpacity>

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

      {/* Emoji Picker Modal */}
      <Modal visible={!!showEmojiPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Emoji</Text>
            <TouchableOpacity onPress={() => setShowEmojiPicker(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <View key={category} style={styles.emojiCategory}>
                <Text style={styles.emojiCategoryLabel}>{category}</Text>
                <View style={styles.emojiCategoryGrid}>
                  {emojis.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={styles.emojiPickerOption}
                      onPress={() => {
                        if (showEmojiPicker === 'add') {
                          setNewEmoji(e);
                        } else {
                          setEditEmoji(e);
                        }
                        setShowEmojiPicker(null);
                      }}
                    >
                      <Text style={styles.emojiPickerOptionText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:              { flex: 1, backgroundColor: C.bg },
    scroll:            { flex: 1 },
    content:           { padding: 20 },
    pageHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    pageTitle:         { fontSize: 32, fontWeight: '700', color: C.text, fontFamily: F.heading },
    pageSubtitle:      { fontSize: 14, color: C.textMuted, marginTop: 2 },
    addHeaderBtn:      { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, marginTop: 6 },
    addHeaderBtnText:  { color: '#fff', fontWeight: '600', fontSize: 14 },
    // Progress
    progressCard:      { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, marginBottom: 20, ...SHADOW.card },
    progressTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel:     { fontSize: 13, color: C.textMuted, fontWeight: '500' },
    progressCount:     { fontSize: 13, fontWeight: '700', color: C.accent },
    progressTrack:     { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
    progressFill:      { height: '100%', backgroundColor: C.accent, borderRadius: 4 },
    allDone:           { fontSize: 13, color: C.sage, fontWeight: '600', marginTop: 10, textAlign: 'center' },
    // Empty
    emptyState:        { alignItems: 'center', paddingVertical: 60 },
    emptyIcon:         { fontSize: 40, marginBottom: 12 },
    emptyTitle:        { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 6 },
    emptyHint:         { fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 240 },
    // Habit rows
    habitList:         { gap: 10 },
    habitRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.card },
    habitRowDone:      { opacity: 0.75 },
    habitRowMuted:     { opacity: 0.45 },
    circle:            { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    circleDone:        { backgroundColor: C.sage, borderColor: C.sage },
    circleCheck:       { color: '#fff', fontSize: 14, fontWeight: '700' },
    habitInfo:         { flex: 1 },
    habitTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    habitEmoji:        { fontSize: 18 },
    habitName:         { fontSize: 15, fontWeight: '600', color: C.text, fontFamily: F.body },
    habitNameDone:     { textDecorationLine: 'line-through', color: C.textMuted },
    habitMeta:         { fontSize: 12, color: C.textMuted },
    deleteBtn:         { padding: 4 },
    deleteBtnText:     { fontSize: 20, color: C.textFaint, lineHeight: 22 },
    // Modal
    modal:             { flex: 1, backgroundColor: C.bg },
    modalHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:        { fontSize: 20, fontWeight: '700', color: C.text },
    modalClose:        { fontSize: 18, color: C.textMuted },
    modalBody:         { flex: 1, padding: 20 },
    modalFooter:       { flexDirection: 'row', gap: 12, padding: 20 },
    fieldLabel:        { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    fieldInput:        { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    emojiPickerBtn:           { backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
    emojiPickerEmoji:         { fontSize: 32 },
    emojiPickerText:          { fontSize: 14, color: C.accent, fontWeight: '500', flex: 1 },
    emojiCategory:            { marginBottom: 20 },
    emojiCategoryLabel:       { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    emojiCategoryGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    emojiPickerOption:        { width: '22%', aspectRatio: 1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCard },
    emojiPickerOptionText:    { fontSize: 32 },
    freqRow:           { flexDirection: 'row', gap: 10 },
    freqBtn:           { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.bgCard },
    freqBtnActive:     { borderColor: C.accent, backgroundColor: C.accentLight },
    freqBtnText:       { fontSize: 13, color: C.textMuted, fontWeight: '500' },
    freqBtnTextActive: { color: C.accent, fontWeight: '700' },
    cancelBtn:         { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelBtnText:     { fontSize: 15, color: C.textMuted, fontWeight: '500' },
    confirmBtn:        { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    confirmBtnText:    { fontSize: 15, color: '#fff', fontWeight: '600' },
  });
}
