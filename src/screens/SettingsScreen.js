import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Switch, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useApp, useTheme, useFont } from '../AppContext';
import { RADIUS, SHADOW, PALETTES, FONT_OPTIONS } from '../theme';

const SECTION_LABELS = {
  work:      { label: 'On Your Plate',      hint: 'Tasks section on home & nav' },
  checkin:   { label: "Today's Check-in",   hint: 'Journal card on home' },
  consuming: { label: 'Currently Enjoying', hint: 'Hobbies card on home & nav' },
  habits:    { label: 'Habits',             hint: 'Habits section on home & nav' },
};

const REORDERABLE_SECTIONS = [
  { key: 'quote', label: 'Quote', emoji: '💭' },
  { key: 'top3', label: "Today's Top 3", emoji: '🎯' },
  { key: 'work', label: 'On Your Plate', emoji: '📋' },
  { key: 'checkin', label: "Today's Check-in", emoji: '📝' },
  { key: 'consuming', label: 'Currently Enjoying', emoji: '🎬' },
];

export default function SettingsScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const [nameInput, setNameInput] = useState(state.userName || '');
  const [weatherLocationInput, setWeatherLocationInput] = useState(state.weatherLocation || '');
  const [reorderingSections, setReorderingSections] = useState(false);

  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  // Get current section order or use default
  const currentSectionOrder = state.sectionOrder || ['quote', 'top3', 'work', 'checkin', 'consuming'];
  const orderedSections = currentSectionOrder.map((key) => REORDERABLE_SECTIONS.find((s) => s.key === key)).filter(Boolean);

  function reorderSections(newData) {
    setState((s) => ({
      ...s,
      sectionOrder: newData.map((item) => item.key),
    }));
  }

  function saveName() {
    setState((s) => ({ ...s, userName: nameInput.trim() }));
  }

  function saveWeatherLocation() {
    setState((s) => ({ ...s, weatherLocation: weatherLocationInput.trim() }));
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
            sectionOrder: ['quote', 'top3', 'work', 'checkin', 'consuming'],
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

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>APPEARANCE</Text>

        <Text style={styles.subsectionLabel}>COLOUR PALETTE</Text>
        <View style={styles.paletteGrid}>
          {Object.entries(PALETTES).map(([key, palette]) => (
            <TouchableOpacity
              key={key}
              style={[styles.paletteItem, state.palette === key && styles.paletteItemActive]}
              onPress={() => setState((s) => ({ ...s, palette: key }))}
            >
              <View style={styles.paletteSwatchRow}>
                <View style={[styles.paletteDot, { backgroundColor: palette.swatch }]} />
                <View style={[styles.paletteDot, { backgroundColor: palette.accent }]} />
                <View style={[styles.paletteDot, { backgroundColor: palette.accentLight }]} />
              </View>
              <Text style={[styles.paletteItemLabel, state.palette === key && { color: C.accent, fontWeight: '700' }]}>
                {palette.label}
              </Text>
              {state.palette === key && <Text style={[styles.paletteItemCheck, { color: C.accent }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subsectionLabel, { marginTop: 20 }]}>FONT STYLE</Text>
        <View style={styles.fontRow}>
          {Object.entries(FONT_OPTIONS).map(([key, font]) => (
            <TouchableOpacity
              key={key}
              style={[styles.fontBtn, state.fontStyle === key && styles.fontBtnActive]}
              onPress={() => setState((s) => ({ ...s, fontStyle: key }))}
            >
              <Text style={[styles.fontBtnSample, font.body ? { fontFamily: font.body } : {}, state.fontStyle === key && { color: C.accent }]}>
                Aa
              </Text>
              <Text style={[styles.fontBtnLabel, state.fontStyle === key && { color: C.accent, fontWeight: '700' }]}>
                {font.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>LOCATION</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Weather location</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your city…"
              placeholderTextColor={C.textFaint}
              value={weatherLocationInput}
              onChangeText={setWeatherLocationInput}
              returnKeyType="done"
              onSubmitEditing={saveWeatherLocation}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveWeatherLocation}>
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

        {/* Reorder Sections */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>REORDER HOME SECTIONS</Text>
        <Text style={styles.sectionHint}>Long-press and drag to reorder.</Text>
        <TouchableOpacity
          style={[styles.card, styles.reorderCard]}
          onPress={() => setReorderingSections(!reorderingSections)}
        >
          <Text style={styles.reorderToggleText}>
            {reorderingSections ? '✓ Done reordering' : '≡ Reorder sections…'}
          </Text>
        </TouchableOpacity>

        {reorderingSections && orderedSections.length > 0 && (
          <View style={[styles.card, { marginTop: 0 }]}>
            <DraggableFlatList
              data={orderedSections}
              onDragEnd={({ data }) => reorderSections(data)}
              keyExtractor={(item) => item.key}
              scrollEnabled={false}
              renderItem={({ item, drag, isActive }) => (
                <ScaleDecorator>
                  <TouchableOpacity
                    style={[styles.reorderItem, isActive && styles.reorderItemActive]}
                    onLongPress={drag}
                    delayLongPress={100}
                  >
                    <Text style={styles.reorderItemEmoji}>{item.emoji}</Text>
                    <Text style={styles.reorderItemLabel}>{item.label}</Text>
                    <Text style={styles.reorderItemHandle}>⋮⋮</Text>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
            />
          </View>
        )}

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

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: C.bg },
    scroll:          { flex: 1 },
    content:         { padding: 20 },
    pageTitle:       { fontSize: 32, fontWeight: '700', color: C.text, marginBottom: 24, fontFamily: F.heading },
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
    toggleLabel:     { fontSize: 15, color: C.text, fontWeight: '500', fontFamily: F.body },
    toggleHint:      { fontSize: 12, color: C.textMuted, marginTop: 2 },
    // Appearance
    subsectionLabel:       { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.6, marginBottom: 10 },
    paletteGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
    paletteItem:           { flex: 0.5, backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    paletteItemActive:     { borderColor: C.accent, borderWidth: 2 },
    paletteSwatchRow:      { flexDirection: 'row', gap: 4, marginBottom: 8 },
    paletteDot:            { width: 24, height: 24, borderRadius: 12 },
    paletteItemLabel:      { fontSize: 12, fontWeight: '500', color: C.text, textAlign: 'center' },
    paletteItemCheck:      { fontSize: 14, fontWeight: '700', marginTop: 4 },
    fontRow:             { flexDirection: 'row', gap: 12 },
    fontBtn:             { flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'center', ...SHADOW.card },
    fontBtnActive:       { borderColor: C.accent, backgroundColor: C.accentLight },
    fontBtnSample:       { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4 },
    fontBtnLabel:        { fontSize: 11, color: C.textMuted },
    // Reorder sections
    reorderCard:          { padding: 14, backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border },
    reorderToggleText:    { fontSize: 15, fontWeight: '500', color: C.accent },
    reorderItem:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border },
    reorderItemActive:    { backgroundColor: C.accentLight, opacity: 0.8 },
    reorderItemEmoji:     { fontSize: 18, marginRight: 10 },
    reorderItemLabel:     { flex: 1, fontSize: 15, color: C.text, fontWeight: '500', fontFamily: F.body },
    reorderItemHandle:    { fontSize: 12, color: C.textMuted, marginLeft: 8 },
    // Danger
    dangerCard:           { borderWidth: 1, borderColor: '#FAD4D4' },
    dangerBtn:            { fontSize: 15, color: C.danger, fontWeight: '500', padding: 16 },
  });
}
