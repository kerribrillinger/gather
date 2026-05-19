import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, useTheme } from '../AppContext';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

const MOODS = ['😊','😢','😐','😤','🤔','💪','😎','🎉'];

const PROMPTS = [
  'What\'s on your mind today?',
  'What are you grateful for?',
  'What did you accomplish today?',
  'How are you feeling right now?',
  'What\'s one thing you want to focus on?',
  'What made you smile today?',
];

function formatEntryDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function JournalScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const [activeTab, setActiveTab] = useState('today');
  const [mood, setMood] = useState(null);
  const [body, setBody] = useState('');

  const styles = useMemo(() => makeStyles(C), [C]);

  const todayStr = new Date().toDateString();
  const todayEntry = (state.checkIns || []).find(
    (e) => new Date(e.createdAt).toDateString() === todayStr
  );
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  function saveEntry() {
    if (!body.trim()) return;
    const entry = {
      id: generateId(),
      body: body.trim(),
      mood,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, checkIns: [entry, ...(s.checkIns || [])] }));
    setBody('');
    setMood(null);
  }

  const pastEntries = (state.checkIns || []).filter(
    (e) => new Date(e.createdAt).toDateString() !== todayStr
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Journal</Text>
          <Text style={styles.pageSubtitle}>Daily reflections and thoughts</Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            {['today', 'past'].map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'today' ? 'Today' : 'Past Entries'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'today' ? (
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardIcon}>📖</Text>
                <Text style={styles.cardTitle}>Today's entry</Text>
              </View>

              {todayEntry ? (
                <View>
                  <Text style={styles.todayMood}>{todayEntry.mood}</Text>
                  <Text style={styles.entryBody}>{todayEntry.body}</Text>
                </View>
              ) : (
                <>
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
                    placeholder={prompt}
                    placeholderTextColor={C.textFaint}
                    value={body}
                    onChangeText={setBody}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={saveEntry}>
                    <Text style={styles.saveBtnText}>Save entry</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View style={styles.entriesList}>
              {pastEntries.length === 0 ? (
                <Text style={styles.empty}>No past entries yet.</Text>
              ) : (
                pastEntries.map((entry) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryMood}>{entry.mood || '📖'}</Text>
                      <View>
                        <Text style={styles.entryDate}>{formatEntryDate(entry.createdAt)}</Text>
                      </View>
                    </View>
                    <Text style={styles.entryBody} numberOfLines={4}>{entry.body}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: C.bg },
    scroll:        { flex: 1 },
    content:       { padding: 20 },
    pageTitle:     { fontSize: 32, fontWeight: '700', color: C.text },
    pageSubtitle:  { fontSize: 14, color: C.textMuted, marginBottom: 20 },
    // Tabs
    tabs:          { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 20 },
    tab:           { paddingVertical: 10, paddingHorizontal: 4, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive:     { borderBottomColor: C.accent },
    tabText:       { fontSize: 15, color: C.textMuted, fontWeight: '500' },
    tabTextActive: { color: C.accent, fontWeight: '600' },
    // Today card
    card:          { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 18, ...SHADOW.card },
    cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    cardIcon:      { fontSize: 18 },
    cardTitle:     { fontSize: 16, fontWeight: '600', color: C.text },
    moodPrompt:    { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 10 },
    moodRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    moodBtn:       { width: 42, height: 42, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    moodBtnActive: { borderColor: C.accent, backgroundColor: C.accentLight },
    moodEmoji:     { fontSize: 22 },
    bodyInput:     { fontSize: 15, color: C.text, minHeight: 160, lineHeight: 24, paddingTop: 4 },
    saveBtn:       { alignSelf: 'flex-end', marginTop: 16, backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md },
    saveBtnText:   { color: '#fff', fontWeight: '600', fontSize: 15 },
    todayMood:     { fontSize: 28, marginBottom: 8 },
    // Past entries
    entriesList:   { gap: 12 },
    entryCard:     { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, ...SHADOW.card },
    entryHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    entryMood:     { fontSize: 28 },
    entryDate:     { fontSize: 13, color: C.textMuted },
    entryBody:     { fontSize: 14, color: C.text, lineHeight: 22 },
    empty:         { fontSize: 14, color: C.textFaint },
  });
}
