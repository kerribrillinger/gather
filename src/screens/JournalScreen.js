import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../BottomSheet';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

const MOODS = ['😊', '😄', '😐', '😔', '😤', '😴', '🤩', '😰'];

const PROMPTS = [
  "What's something small that made you smile today?",
  "What are you looking forward to?",
  "How are you actually doing right now?",
  "What's been on your mind lately?",
  "What do you want to remember about today?",
  "What's one thing you're grateful for right now?",
  "What are you in the mood for today?",
  "What would make today feel good?",
  "What's a thought you haven't told anyone yet?",
  "What does your body need right now?",
  "What's one thing you can let go of today?",
  "What are you curious about lately?",
];

function generateTitle(bodyText) {
  const trimmed = bodyText.trim();
  if (!trimmed) return 'Untitled entry';
  return trimmed.length <= 40 ? trimmed : trimmed.slice(0, 40);
}

function formatEntryDate(iso) {
  const d = new Date(iso);
  const todayStr = new Date().toDateString();
  if (d.toDateString() === todayStr) {
    return 'Today · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function JournalScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const F = useFont();
  const showAlert = useAlert();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [composeOpen, setComposeOpen] = useState(false);
  const [mood, setMood] = useState(null);
  const [body, setBody] = useState('');
  const [promptIndex, setPromptIndex] = useState(new Date().getDate() % PROMPTS.length);
  const [promptUseActive, setPromptUseActive] = useState(true);

  const [editingEntry, setEditingEntry] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [editMood, setEditMood] = useState(null);

  const sortOrder = state.checkinSortOrder || 'newest';

  const allEntries = useMemo(() => {
    const entries = [...(state.checkIns || [])];
    return sortOrder === 'newest'
      ? entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [state.checkIns, sortOrder]);

  const currentPrompt = PROMPTS[promptIndex];

  function cyclePrompt() {
    let next;
    do { next = Math.floor(Math.random() * PROMPTS.length); }
    while (next === promptIndex && PROMPTS.length > 1);
    setPromptIndex(next);
  }

  function openCompose() {
    setMood(null);
    setBody('');
    setComposeOpen(true);
  }

  function saveEntry() {
    if (!body.trim()) return;
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      checkIns: [
        { id: generateId(), title: generateTitle(body), body: body.trim(), mood, createdAt: now, date: now },
        ...(s.checkIns || []),
      ],
    }));
    setBody('');
    setMood(null);
    setComposeOpen(false);
    showToast('Entry saved');
  }

  function saveEdit() {
    if (!editBody.trim()) return;
    setState((s) => ({
      ...s,
      checkIns: (s.checkIns || []).map((e) =>
        e.id === editingEntry.id
          ? { ...e, title: generateTitle(editBody), body: editBody.trim(), mood: editMood }
          : e
      ),
    }));
    setEditingEntry(null);
    showToast('Entry updated');
  }

  function deleteEntry(id) {
    showAlert({
      title: 'Delete entry',
      message: 'This cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setState((s) => ({ ...s, checkIns: (s.checkIns || []).filter((e) => e.id !== id) })) },
      ],
    });
  }

  function toggleSortOrder() {
    setState((s) => ({ ...s, checkinSortOrder: sortOrder === 'newest' ? 'oldest' : 'newest' }));
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Journal</Text>
        <Text style={styles.pageSubtitle}>Daily reflections and thoughts</Text>

        {/* Sort toggle */}
        {allEntries.length > 1 && (
          <View style={styles.sortRow}>
            <TouchableOpacity onPress={toggleSortOrder}>
              <Text style={styles.sortToggleText}>
                {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {allEntries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No entries yet.{'\n'}Tap + to write your first one.</Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {allEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <TouchableOpacity style={styles.entryDeleteBtn} onPress={() => deleteEntry(entry.id)}>
                  <Text style={styles.entryDeleteBtnText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryMood}>{entry.mood || '📖'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryCardTitle} numberOfLines={1}>{entry.title || 'Entry'}</Text>
                    <Text style={styles.entryDate}>{formatEntryDate(entry.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.entryBody} numberOfLines={4}>{entry.body}</Text>
                <TouchableOpacity
                  onPress={() => { setEditingEntry(entry); setEditBody(entry.body); setEditMood(entry.mood); }}
                  style={styles.editLink}
                >
                  <Text style={styles.editLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: C.accent }]} onPress={openCompose}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Compose sheet */}
      <BottomSheet visible={composeOpen} onClose={() => setComposeOpen(false)} backgroundColor={C.bg} fullHeight>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>New Entry</Text>
            <TouchableOpacity style={[styles.sheetSaveBtn, !body.trim() && { opacity: 0.4 }]} onPress={saveEntry} disabled={!body.trim()}>
              <Text style={styles.sheetSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Prompt bar */}
            <View style={styles.promptBar}>
              <View style={styles.promptTopRow}>
                <View style={styles.promptToggleRow}>
                  <Switch
                    value={promptUseActive}
                    onValueChange={setPromptUseActive}
                    trackColor={{ false: C.border, true: C.accent }}
                    thumbColor="#fff"
                    ios_backgroundColor={C.border}
                  />
                  <Text style={styles.promptToggleLabel}>Use prompt</Text>
                </View>
                <TouchableOpacity style={styles.promptNewBtn} onPress={cyclePrompt}>
                  <Text style={styles.promptNewBtnText}>New prompt</Text>
                </TouchableOpacity>
              </View>
              {promptUseActive && <Text style={styles.promptText}>{currentPrompt}</Text>}
            </View>

            <Text style={styles.moodPrompt}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <Pressable key={m} style={[styles.moodBtn, mood === m && styles.moodBtnActive]} onPress={() => setMood(m === mood ? null : m)}>
                  <Text style={styles.moodEmoji}>{m}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.bodyInput}
              multiline
              placeholder={promptUseActive ? currentPrompt : "What's on your mind?"}
              placeholderTextColor={C.textFaint}
              value={body}
              onChangeText={setBody}
              textAlignVertical="top"
              autoFocus
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet visible={!!editingEntry} onClose={() => setEditingEntry(null)} backgroundColor={C.bg} fullHeight>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Entry</Text>
            <TouchableOpacity style={[styles.sheetSaveBtn, !editBody.trim() && { opacity: 0.4 }]} onPress={saveEdit} disabled={!editBody.trim()}>
              <Text style={styles.sheetSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.moodPrompt}>How were you feeling?</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <Pressable key={m} style={[styles.moodBtn, editMood === m && styles.moodBtnActive]} onPress={() => setEditMood(m === editMood ? null : m)}>
                  <Text style={styles.moodEmoji}>{m}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.bodyInput, { borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, padding: 12, backgroundColor: C.bgCard }]}
              multiline
              value={editBody}
              onChangeText={setEditBody}
              textAlignVertical="top"
              autoFocus
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:             { flex: 1, backgroundColor: C.bg },
    scroll:           { flex: 1 },
    content:          { padding: 20 },
    pageTitle:        { fontSize: 26, color: C.text, fontFamily: F.heading },
    pageSubtitle:     { fontSize: 13, color: C.textMuted, marginBottom: 16, fontFamily: F.body },
    sortRow:          { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
    sortToggleText:   { fontSize: 12, color: C.accent, fontFamily: F.heading },
    fab:              { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    // Empty state
    empty:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText:        { fontSize: 15, color: C.textMuted, fontFamily: F.body, textAlign: 'center', lineHeight: 24 },
    // Entry cards
    entriesList:      { gap: 12 },
    entryCard:        { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.card, position: 'relative' },
    entryHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8, paddingRight: 24 },
    entryMood:        { fontSize: 22, marginTop: 1 },
    entryCardTitle:   { fontSize: 14, fontFamily: F.heading, color: C.text, marginBottom: 2 },
    entryDate:        { fontSize: 11, color: C.textFaint, fontFamily: F.body },
    entryBody:        { fontSize: 13, color: C.textMuted, lineHeight: 20, fontFamily: F.body },
    entryDeleteBtn:   { position: 'absolute', top: 10, right: 12, padding: 4, zIndex: 1 },
    entryDeleteBtnText: { fontSize: 16, color: C.textFaint, fontFamily: F.body },
    editLink:         { marginTop: 10, alignSelf: 'flex-start' },
    editLinkText:     { fontSize: 12, color: C.accent, fontFamily: F.heading },
    // Compose / edit sheet
    sheetHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
    sheetTitle:       { fontSize: 18, fontFamily: F.heading, color: C.text },
    sheetSaveBtn:     { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.md },
    sheetSaveBtnText: { color: '#fff', fontFamily: F.heading, fontSize: 14 },
    sheetBody:        { paddingHorizontal: 20, paddingBottom: 40 },
    // Prompt bar
    promptBar:        { backgroundColor: C.accentLight, borderRadius: RADIUS.md, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.border },
    promptTopRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    promptToggleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    promptToggleLabel:{ fontSize: 13, fontFamily: F.body, color: C.text },
    promptNewBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.accent },
    promptNewBtnText: { fontSize: 12, fontFamily: F.heading, color: C.accent },
    promptText:       { fontSize: 13, color: C.text, lineHeight: 20, marginTop: 10, fontFamily: F.italic || F.body },
    moodPrompt:       { fontSize: 14, fontFamily: F.body, color: C.text, marginBottom: 10 },
    moodRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    moodBtn:          { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    moodBtnActive:    { borderColor: C.accent, backgroundColor: C.accentLight },
    moodEmoji:        { fontSize: 20 },
    bodyInput:        { fontSize: 14, color: C.text, minHeight: 140, lineHeight: 24, paddingTop: 4, fontFamily: F.body },
  });
}
