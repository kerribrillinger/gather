import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Switch, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, useTheme } from '../AppContext';
import { RADIUS, SHADOW } from '../theme';

const SECTION_LABELS = {
  work:      { label: 'On Your Plate',      hint: 'Tasks section on home & nav' },
  checkin:   { label: "Today's Check-in",   hint: 'Journal card on home' },
  consuming: { label: 'Currently Enjoying', hint: 'Hobbies card on home & nav' },
  habits:    { label: 'Habits',             hint: 'Habits section on home & nav' },
};

export default function SettingsScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const [nameInput, setNameInput] = useState(state.userName || '');

  const styles = useMemo(() => makeStyles(C), [C]);

  function saveName() {
    setState((s) => ({ ...s, userName: nameInput.trim() }));
  }

  function toggleSection(key) {
    setState((s) => {
      const hidden = s.hiddenSections || [];
      const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
      return { ...s, hiddenSections: next };
    });
  }

  function toggleWeekendMode(value) {
    setState((s) => ({ ...s, weekendMode: value }));
  }

  function resetData() {
    Alert.alert(
      'Reset all data',
      'This will permanently delete all your tasks, journals, habits, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: () => setState(() => ({
            userName: '',
            currentlyConsuming: [],
            checkIns: [],
            workTodos: {},
            workNotes: {},
            workLists: [{ id: 'personal', name: 'Personal', colorIndex: 0, isWork: false }],
            focusItems: [],
            focusDate: '',
            habits: [],
            habitLog: {},
            checkinSortOrder: 'newest',
            weekendMode: false,
            hiddenSections: [],
            theme: 'light',
            palette: 'warm',
          })),
        },
      ]
    );
  }

  const hiddenSections = state.hiddenSections || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Your name</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name…"
              placeholderTextColor={C.textFaint}
              value={nameInput}
              onChangeText={setNameInput}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sections */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SECTIONS</Text>
        <Text style={styles.sectionHint}>Choose what appears on your home screen and bottom nav.</Text>
        <View style={styles.card}>
          {Object.entries(SECTION_LABELS).map(([key, { label, hint }], i, arr) => (
            <View key={key} style={[styles.toggleRow, i < arr.length - 1 && styles.toggleRowBorder]}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Text style={styles.toggleHint}>{hint}</Text>
              </View>
              <Switch
                value={!hiddenSections.includes(key)}
                onValueChange={() => toggleSection(key)}
                trackColor={{ false: C.border, true: C.accent }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Modes */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>MODES</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Weekend / OOO Mode</Text>
              <Text style={styles.toggleHint}>Hides work-tagged lists from Tasks and home</Text>
            </View>
            <Switch
              value={!!state.weekendMode}
              onValueChange={toggleWeekendMode}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Dark Mode</Text>
              <Text style={styles.toggleHint}>Switch to a dark colour scheme</Text>
            </View>
            <Switch
              value={state.theme === 'dark'}
              onValueChange={(v) => setState((s) => ({ ...s, theme: v ? 'dark' : 'light' }))}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Danger zone */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>DANGER ZONE</Text>
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity onPress={resetData}>
            <Text style={styles.dangerBtn}>Reset all data…</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: C.bg },
    scroll:          { flex: 1 },
    content:         { padding: 20 },
    pageTitle:       { fontSize: 32, fontWeight: '700', color: C.text, marginBottom: 24 },
    sectionLabel:    { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    sectionHint:     { fontSize: 13, color: C.textMuted, marginBottom: 12, marginTop: -4 },
    card:            { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, ...SHADOW.card, overflow: 'hidden' },
    // Profile
    fieldLabel:      { fontSize: 13, color: C.textMuted, fontWeight: '500', marginBottom: 8, padding: 16, paddingBottom: 0 },
    nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 8 },
    nameInput:       { flex: 1, backgroundColor: C.bg, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    saveBtn:         { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md },
    saveBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
    // Toggle rows
    toggleRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    toggleInfo:      { flex: 1, marginRight: 12 },
    toggleLabel:     { fontSize: 15, color: C.text, fontWeight: '500' },
    toggleHint:      { fontSize: 12, color: C.textMuted, marginTop: 2 },
    // Danger
    dangerCard:      { borderWidth: 1, borderColor: '#FAD4D4' },
    dangerBtn:       { fontSize: 15, color: C.danger, fontWeight: '500', padding: 16 },
  });
}
