import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { useApp, useTheme, useFont } from '../AppContext';
import { RADIUS, SHADOW, PALETTES } from '../theme';

export default function WelcomeScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [nameInput, setNameInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(state.theme || 'light');
  const [selectedPalette, setSelectedPalette] = useState(state.palette || 'default');

  function handleGetStarted() {
    if (!nameInput.trim()) return;
    setState((s) => ({
      ...s,
      userName: nameInput.trim(),
      theme: selectedTheme,
      palette: selectedPalette,
    }));
  }

  const paletteEntries = Object.entries(PALETTES);
  const paletteGrid = [];
  for (let i = 0; i < paletteEntries.length; i += 2) {
    paletteGrid.push(paletteEntries.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🎯</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to Gather</Text>
        <Text style={styles.subtitle}>Your cozy personal dashboard. Let's get you set up.</Text>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APPEARANCE</Text>

          {/* Theme Toggle */}
          <View style={styles.themeRow}>
            <Text style={styles.themeLabel}>Theme</Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[styles.themeBtn, selectedTheme === 'light' && styles.themeBtnActive]}
                onPress={() => setSelectedTheme('light')}
              >
                <Text style={styles.themeBtnEmoji}>☀️</Text>
                <Text style={[styles.themeBtnText, selectedTheme === 'light' && styles.themeBtnTextActive]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, selectedTheme === 'dark' && styles.themeBtnActive]}
                onPress={() => setSelectedTheme('dark')}
              >
                <Text style={styles.themeBtnEmoji}>🌙</Text>
                <Text style={[styles.themeBtnText, selectedTheme === 'dark' && styles.themeBtnTextActive]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Palette Grid */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>COLOUR PALETTE</Text>
          {paletteGrid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.paletteRow}>
              {row.map(([key, palette]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.paletteOption, selectedPalette === key && styles.paletteOptionActive]}
                  onPress={() => setSelectedPalette(key)}
                >
                  <View style={styles.paletteSwatches}>
                    <View style={[styles.paletteSwatch, { backgroundColor: palette.swatch }]} />
                    <View style={[styles.paletteSwatch, { backgroundColor: palette.accent }]} />
                    <View style={[styles.paletteSwatch, { backgroundColor: palette.accentLight }]} />
                  </View>
                  <Text style={[styles.paletteLabel, selectedPalette === key && { color: C.accent, fontWeight: '700' }]}>
                    {palette.label}
                  </Text>
                  {selectedPalette === key && <Text style={[styles.paletteCheck, { color: C.accent }]}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROFILE</Text>
          <Text style={styles.nameQuestion}>What's your name?</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Kerri"
            placeholderTextColor={C.textFaint}
            value={nameInput}
            onChangeText={setNameInput}
            maxLength={18}
            returnKeyType="done"
            onSubmitEditing={handleGetStarted}
          />
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={[styles.getStartedBtn, !nameInput.trim() && styles.getStartedBtnDisabled]}
          onPress={handleGetStarted}
          disabled={!nameInput.trim()}
        >
          <Text style={styles.getStartedBtnText}>Let's go →</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:                  { flex: 1, backgroundColor: C.bg },
    scroll:                { flex: 1 },
    content:               { padding: 20 },
    // Logo
    logoContainer:         { alignItems: 'center', marginTop: 40, marginBottom: 24 },
    logo:                  { fontSize: 64 },
    // Title
    title:                 { fontSize: 32, fontWeight: '700', color: C.text, marginBottom: 8, fontFamily: F.heading },
    subtitle:              { fontSize: 15, color: C.textMuted, marginBottom: 40, lineHeight: 22 },
    // Section
    section:               { marginBottom: 32 },
    sectionLabel:          { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 12 },
    // Theme
    themeRow:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    themeLabel:            { fontSize: 14, fontWeight: '500', color: C.text },
    themeButtons:          { flexDirection: 'row', gap: 8 },
    themeBtn:              { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
    themeBtnActive:        { borderColor: C.accent, backgroundColor: C.accentLight },
    themeBtnEmoji:         { fontSize: 16 },
    themeBtnText:          { fontSize: 13, color: C.textMuted, fontWeight: '500' },
    themeBtnTextActive:    { color: C.accent, fontWeight: '600' },
    // Palette
    paletteRow:            { flexDirection: 'row', gap: 12, marginBottom: 12 },
    paletteOption:         { flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    paletteOptionActive:   { borderColor: C.accent, borderWidth: 2 },
    paletteSwatches:       { flexDirection: 'row', gap: 4, marginBottom: 8 },
    paletteSwatch:         { width: 20, height: 20, borderRadius: 10 },
    paletteLabel:          { fontSize: 11, fontWeight: '500', color: C.textMuted, textAlign: 'center' },
    paletteCheck:          { fontSize: 12, fontWeight: '700', marginTop: 2 },
    // Name
    nameQuestion:          { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 10 },
    nameInput:             { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    // Button
    getStartedBtn:         { backgroundColor: C.accent, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', marginTop: 16, ...SHADOW.card },
    getStartedBtnDisabled: { opacity: 0.5 },
    getStartedBtnText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
