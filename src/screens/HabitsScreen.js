import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import BottomSheet from '../BottomSheet';
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
  return new Date().toISOString().slice(0, 10);
}

function dateKey(d) {
  return d.toISOString().slice(0, 10);
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
    if (!log[dateKey(d)]) break;
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
  const showAlert = useAlert();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFreq, setNewFreq] = useState('daily');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const [editingHabit, setEditingHabit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFreq, setEditFreq] = useState('daily');
  const [editEmoji, setEditEmoji] = useState('⭐');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // 'add' or 'edit'

  // Flash animation values keyed by habit id
  const flashAnims = useRef({});

  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const habits = state.habits || [];
  const today = todayKey();

  /**
   * Returns the Animated.Value for a given habit id, creating one on first access.
   */
  function getFlashAnim(habitId) {
    if (!flashAnims.current[habitId]) {
      flashAnims.current[habitId] = new Animated.Value(0);
    }
    return flashAnims.current[habitId];
  }

  /**
   * Runs the flash sequence (0→1→0) over 500ms total for the given habit id.
   * Only called when toggling FROM unchecked TO checked.
   */
  function triggerFlash(habitId) {
    const anim = getFlashAnim(habitId);
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start();
  }

  function toggleHabit(habitId) {
    setState((s) => {
      const log = s.habitLog || {};
      const dayLog = { ...(log[habitId] || {}) };
      const wasChecked = !!dayLog[today];
      if (wasChecked) {
        delete dayLog[today];
      } else {
        dayLog[today] = true;
        // Trigger flash only when checking (unchecked → checked)
        triggerFlash(habitId);
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
    showToast('Habit added');
  }

  function deleteHabit(id) {
    const habit = (state.habits || []).find((h) => h.id === id);
    if (!habit) return;
    const streak = getStreak(id, state.habitLog || {}, habit.frequency);
    showAlert({
      title: 'Delete habit',
      message: `This will delete "${habit.name}" and erase all ${streak} days of streak history. This cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setState((s) => {
              const newLog = { ...(s.habitLog || {}) };
              delete newLog[id];
              return { ...s, habits: (s.habits || []).filter((h) => h.id !== id), habitLog: newLog };
            });
          },
        },
      ],
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
    showToast('Habit updated');
  }

  /** Show ⋯ menu with Edit / Delete options. */
  function openHabitMenu(habit) {
    showAlert({
      title: habit.name,
      buttons: [
        {
          text: 'Edit',
          onPress: () => {
            setEditingHabit(habit);
            setEditName(habit.name);
            setEditEmoji(habit.emoji);
            setEditFreq(habit.frequency);
          },
        },
        { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
        { text: 'Cancel', style: 'cancel' },
      ],
    });
  }

  const todayIsWeekend = isWeekend(new Date());
  const applicableHabits = habits.filter((h) => !(h.frequency === 'weekday' && todayIsWeekend));
  const completedToday = applicableHabits.filter((h) => !!(state.habitLog?.[h.id]?.[today])).length;
  const totalToday = applicableHabits.length;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page header: title + X/Y progress text on left, circular + button on right */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Habits</Text>
            {totalToday > 0 && (
              <Text style={styles.progressText}>{completedToday}/{totalToday} today</Text>
            )}
          </View>
        </View>

        {/* Progress bar — 6px height */}
        {totalToday > 0 && (
          <View style={styles.progressTrackContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((completedToday / totalToday) * 100)}%` }]} />
            </View>
            {completedToday === totalToday && (
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
              const freqLabel = FREQ_OPTIONS.find((f) => f.key === habit.frequency)?.label || 'Daily';
              const categoryLabel = isWeekdayHabitOnWeekend
                ? `${freqLabel} · rest day`
                : freqLabel;

              // Animated values for this habit's flash effect
              const flashAnim = getFlashAnim(habit.id);

              // Background colour interpolates accent gold → bright yellow → accent gold
              const animatedBg = flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [C.accent, '#F5D000'],
              });

              // Shadow opacity interpolates 0 → 0.6 → 0
              const animatedShadowOpacity = flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6],
              });

              return (
                <View key={habit.id} style={[styles.habitRow, done && styles.habitRowDone, isWeekdayHabitOnWeekend && styles.habitRowMuted]}>
                  {/* Check circle — 24×24, accent gold when done; flashes bright yellow on check */}
                  <Pressable
                    onPress={() => !isWeekdayHabitOnWeekend && toggleHabit(habit.id)}
                  >
                    {done ? (
                      // Animated.View used when done so flash can play
                      <Animated.View
                        style={[
                          styles.circle,
                          styles.circleDone,
                          {
                            backgroundColor: animatedBg,
                            borderColor: animatedBg,
                            shadowColor: '#F5D000',
                            shadowRadius: 8,
                            shadowOpacity: animatedShadowOpacity,
                            elevation: 8,
                          },
                        ]}
                      >
                        <Text style={styles.circleCheck}>✓</Text>
                      </Animated.View>
                    ) : (
                      <View style={styles.circle} />
                    )}
                  </Pressable>
                  <View style={styles.habitInfo}>
                    <View style={styles.habitTitleRow}>
                      <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                      <Text style={[styles.habitName, done && styles.habitNameDone]}>{habit.name}</Text>
                    </View>
                    {/* Category label below habit name — 11px uppercase faint */}
                    <Text style={styles.habitCategoryLabel}>{categoryLabel.toUpperCase()}</Text>
                  </View>
                  {/* Streak display — right side */}
                  {streak > 0 && !isWeekdayHabitOnWeekend && (
                    <Text style={styles.habitStreak}>🔥 {streak}</Text>
                  )}
                  {/* ⋯ menu button replaces inline edit/delete buttons */}
                  <TouchableOpacity onPress={() => openHabitMenu(habit)} style={styles.menuBtn}>
                    <Text style={styles.menuBtnText}>⋯</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Habit BottomSheet */}
      <BottomSheet visible={!!editingHabit} onClose={() => setEditingHabit(null)} backgroundColor={C.bgCard}>
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
      </BottomSheet>

      {/* Add Habit BottomSheet */}
      <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)} backgroundColor={C.bgCard}>
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
      </BottomSheet>

      {/* Emoji Picker BottomSheet */}
      <BottomSheet visible={!!showEmojiPicker} onClose={() => setShowEmojiPicker(null)} backgroundColor={C.bgCard}>
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
      </BottomSheet>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: C.accent }]} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:              { flex: 1, backgroundColor: C.bg },
    scroll:            { flex: 1 },
    content:           { padding: 20 },
    // Page header: title + X/Y progress on left, circular + button on right
    pageHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    pageTitle:         { fontSize: 26, color: C.text, fontFamily: F.heading },
    progressText:      { fontSize: 13, color: C.textMuted, marginTop: 2, fontFamily: F.body },
    // Circular + button: 36×36, borderRadius 18, accent gold
    fab:               { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    // Progress bar — 6px height, no separate card
    progressTrackContainer: { marginBottom: 20 },
    progressTrack:     { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    progressFill:      { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
    allDone:           { fontSize: 13, color: C.sage, fontFamily: F.heading, marginTop: 8, textAlign: 'center' },
    // Empty
    emptyState:        { alignItems: 'center', paddingVertical: 60 },
    emptyIcon:         { fontSize: 40, marginBottom: 12 },
    emptyTitle:        { fontSize: 16, fontFamily: F.heading, color: C.text, marginBottom: 6 },
    emptyHint:         { fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 240, fontFamily: F.body },
    // Habit rows
    habitList:         { gap: 10 },
    habitRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, paddingVertical: 13, paddingHorizontal: 14, ...SHADOW.card },
    habitRowDone:      { opacity: 0.75 },
    habitRowMuted:     { opacity: 0.45 },
    // Check circle — 24×24, accent gold (not sage)
    circle:            { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    circleDone:        { backgroundColor: C.accent, borderColor: C.accent },
    circleCheck:       { color: '#fff', fontSize: 11, fontFamily: F.heading },
    habitInfo:         { flex: 1 },
    habitTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    habitEmoji:        { fontSize: 22 },
    habitName:         { fontSize: 14, color: C.text, fontFamily: F.body },
    habitNameDone:     { textDecorationLine: 'line-through', color: C.textMuted },
    // Category label — 11px uppercase faint, below habit name
    habitCategoryLabel: { fontSize: 11, color: C.textFaint, letterSpacing: 0.5, fontFamily: F.body },
    // Streak — right side of habit row
    habitStreak:       { fontSize: 12, color: C.textMuted, fontFamily: F.body },
    // ⋯ menu button — replaces inline pencil/delete
    menuBtn:           { padding: 6 },
    menuBtnText:       { fontSize: 18, color: C.textMuted, letterSpacing: 1, fontFamily: F.body },
    // Modal
    modal:             { flex: 1, backgroundColor: C.bg },
    modalHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:        { fontSize: 20, fontFamily: F.heading, color: C.text },
    modalClose:        { fontSize: 18, color: C.textMuted, fontFamily: F.body },
    modalBody:         { flex: 1, padding: 20 },
    modalFooter:       { flexDirection: 'row', gap: 12, padding: 20 },
    fieldLabel:        { fontSize: 11, fontFamily: F.heading, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    fieldInput:        { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    emojiPickerBtn:           { backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
    emojiPickerEmoji:         { fontSize: 32 },
    emojiPickerText:          { fontSize: 14, color: C.accent, fontFamily: F.body, flex: 1 },
    emojiCategory:            { marginBottom: 20 },
    emojiCategoryLabel:       { fontSize: 12, fontFamily: F.heading, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    emojiCategoryGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    emojiPickerOption:        { width: '22%', aspectRatio: 1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCard },
    emojiPickerOptionText:    { fontSize: 32 },
    freqRow:           { flexDirection: 'row', gap: 10 },
    freqBtn:           { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.bgCard },
    freqBtnActive:     { borderColor: C.accent, backgroundColor: C.accentLight },
    freqBtnText:       { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    freqBtnTextActive: { color: C.accent, fontFamily: F.heading },
    cancelBtn:         { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelBtnText:     { fontSize: 15, color: C.textMuted, fontFamily: F.body },
    confirmBtn:        { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    confirmBtnText:    { fontSize: 15, color: '#fff', fontFamily: F.heading },
  });
}
