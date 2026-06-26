import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useApp, useTheme, useFont } from '../AppContext';
import { RADIUS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SunIcon({ color, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
      />
    </Svg>
  );
}

function MoonIcon({ color, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function GatherLogo({ size = 72 }) {
  const r = size * 0.24;
  const c1 = size * 0.34;
  const c2 = size * 0.66;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx={27} cy={27} r={19} fill="#EDD9A3" opacity={1} />
      <Circle cx={53} cy={27} r={19} fill="#C9A84C" opacity={0.85} />
      <Circle cx={27} cy={53} r={19} fill="#C9A84C" opacity={0.7} />
      <Circle cx={53} cy={53} r={19} fill="#EDD9A3" opacity={0.6} />
    </Svg>
  );
}

const FEATURE_ROWS = [
  { emoji: '✅', label: 'Tasks & to-dos',       desc: "Organise your lists and track what's due" },
  { emoji: '🔁', label: 'Daily habits',          desc: 'Build streaks and stay consistent' },
  { emoji: '📓', label: 'Journal',               desc: 'Write freely or use a daily prompt' },
  { emoji: '⏱️', label: 'Countdowns',            desc: "Count down to the things you're excited about" },
  { emoji: '🖼️', label: 'Photos & quick links',  desc: 'Keep your favourites one tap away' },
];

const CUSTOMISE_ROWS = [
  { emoji: '🎨', label: 'Colour themes',   desc: '10+ palettes, light and dark mode' },
  { emoji: '🔤', label: 'Custom fonts',    desc: 'Pick a font that feels like you' },
  { emoji: '📐', label: 'Reorder cards',   desc: 'Arrange your home screen your way' },
  { emoji: '🏖️', label: 'Weekend mode',   desc: 'Automatically hide work stuff on weekends' },
];

export default function WelcomeScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [nameInput, setNameInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(state.theme || 'light');
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const TOTAL_SLIDES = 4;

  function goToSlide(index) {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentSlide(index);
  }

  function handleNext() {
    if (currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1);
  }

  function handleGetStarted() {
    if (!nameInput.trim()) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
      setState((s) => ({
        ...s,
        userName: nameInput.trim(),
        theme: selectedTheme,
        palette: s.palette || 'default',
      }));
    });
  }

  const slides = [
    // ── Slide 1: Welcome ──────────────────────────────────────────────────────
    <View style={styles.slide} key="welcome">
      <View style={styles.slideInner}>
        <View style={styles.logoWrap}>
          <GatherLogo size={88} />
        </View>
        <Text style={styles.heroTitle}>Welcome to Gather</Text>
        <Text style={styles.heroSubtitle}>
          Your cosy personal dashboard — everything you need, beautifully in one place.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Get started →</Text>
        </TouchableOpacity>
      </View>
    </View>,

    // ── Slide 2: What's inside ─────────────────────────────────────────────
    <View style={styles.slide} key="features">
      <View style={styles.slideInner}>
        <Text style={styles.slideTitle}>Your life, one place</Text>
        <Text style={styles.slideSubtitle}>Everything you want to keep track of, right on your home screen.</Text>
        <View style={styles.featureList}>
          {FEATURE_ROWS.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>,

    // ── Slide 3: Customise ────────────────────────────────────────────────
    <View style={styles.slide} key="customise">
      <View style={styles.slideInner}>
        <Text style={styles.slideTitle}>Make it yours</Text>
        <Text style={styles.slideSubtitle}>Gather is fully customisable — tweak it until it feels like home.</Text>
        <View style={styles.featureList}>
          {CUSTOMISE_ROWS.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.settingsHint}>You can change all of this anytime in Settings ⚙️</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Almost there →</Text>
        </TouchableOpacity>
      </View>
    </View>,

    // ── Slide 4: Set up ───────────────────────────────────────────────────
    <View style={styles.slide} key="setup">
      <View style={styles.slideInner}>
        <View style={styles.logoWrap}>
          <GatherLogo size={56} />
        </View>
        <Text style={styles.slideTitle}>Let's set you up</Text>
        <Text style={styles.slideSubtitle}>Just a couple of things and you're in.</Text>

        <Text style={styles.fieldLabel}>What's your name?</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. Kerri"
          placeholderTextColor={C.textFaint}
          value={nameInput}
          onChangeText={setNameInput}
          maxLength={24}
          returnKeyType="done"
          onSubmitEditing={handleGetStarted}
          autoCapitalize="words"
        />

        <Text style={styles.fieldLabel}>Appearance</Text>
        <View style={styles.themeButtons}>
          <TouchableOpacity
            style={[styles.themeBtn, selectedTheme === 'light' ? styles.themeBtnActive : styles.themeBtnInactive]}
            onPress={() => setSelectedTheme('light')}
          >
            <SunIcon color={selectedTheme === 'light' ? C.accent : C.textMuted} size={18} />
            <Text style={[styles.themeBtnText, selectedTheme === 'light' && styles.themeBtnTextActive]}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeBtn, selectedTheme === 'dark' ? styles.themeBtnActive : styles.themeBtnInactive]}
            onPress={() => setSelectedTheme('dark')}
          >
            <MoonIcon color={selectedTheme === 'dark' ? C.accent : C.textMuted} size={18} />
            <Text style={[styles.themeBtnText, selectedTheme === 'dark' && styles.themeBtnTextActive]}>Dark</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !nameInput.trim() && styles.primaryBtnDisabled]}
          onPress={handleGetStarted}
          disabled={!nameInput.trim()}
        >
          <Text style={styles.primaryBtnText}>Let's go 🎉</Text>
        </TouchableOpacity>
      </View>
    </View>,
  ];

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
    <SafeAreaView style={styles.safe} edges={[]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => item}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <TouchableOpacity key={i} onPress={() => i < currentSlide && goToSlide(i)}>
            <View style={[styles.dot, i === currentSlide && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
    </Animated.View>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:              { flex: 1, backgroundColor: C.bg },
    slide:             { width: SCREEN_WIDTH, flex: 1 },
    slideInner:        { flex: 1, paddingHorizontal: 32, paddingTop: 52, paddingBottom: 32, justifyContent: 'center' },
    logoWrap:          { alignItems: 'center', marginBottom: 28 },
    heroTitle:         { fontSize: 32, fontFamily: F.heading, color: C.text, textAlign: 'center', marginBottom: 12 },
    heroSubtitle:      { fontSize: 15, fontFamily: F.body, color: C.textMuted, textAlign: 'center', lineHeight: 23, marginBottom: 40 },
    slideTitle:        { fontSize: 26, fontFamily: F.heading, color: C.text, marginBottom: 8 },
    slideSubtitle:     { fontSize: 14, fontFamily: F.body, color: C.textMuted, lineHeight: 21, marginBottom: 28 },
    featureList:       { gap: 16, marginBottom: 28 },
    featureRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    featureEmoji:      { fontSize: 22, width: 28, textAlign: 'center', marginTop: 1 },
    featureText:       { flex: 1 },
    featureLabel:      { fontSize: 15, fontFamily: F.heading, color: C.text, marginBottom: 1 },
    featureDesc:       { fontSize: 13, fontFamily: F.body, color: C.textMuted, lineHeight: 19 },
    settingsHint:      { fontSize: 13, fontFamily: F.body, color: C.textFaint, textAlign: 'center', marginBottom: 24 },
    fieldLabel:        { fontSize: 13, fontFamily: F.heading, color: C.text, marginBottom: 10 },
    nameInput:         { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, fontFamily: F.body, color: C.text, borderWidth: 1.5, borderColor: C.border, marginBottom: 24 },
    themeButtons:      { flexDirection: 'row', gap: 10, marginBottom: 28 },
    themeBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 13, borderRadius: RADIUS.lg, borderWidth: 1.5 },
    themeBtnActive:    { borderColor: C.accent, backgroundColor: C.accentLight },
    themeBtnInactive:  { borderColor: C.border, backgroundColor: C.bgCard },
    themeBtnText:      { fontSize: 14, fontFamily: F.body, color: C.textMuted },
    themeBtnTextActive:{ color: C.accent },
    primaryBtn:        { backgroundColor: C.accent, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
    primaryBtnDisabled:{ opacity: 0.4 },
    primaryBtnText:    { color: '#fff', fontSize: 16, fontFamily: F.heading },
    dots:              { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 32 },
    dot:               { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
    dotActive:         { width: 20, backgroundColor: C.accent },
  });
}
