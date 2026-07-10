import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Pressable, Image, Linking, Vibration, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import BottomSheet from '../BottomSheet';
import { useApp, useTheme, useFont } from '../AppContext';
import { generateId } from '../storage';
import { RADIUS, SHADOW, LIST_BADGE_COLORS } from '../theme';

// Human-readable labels for each home card key — mirrors SettingsScreen
const HOME_CARD_LABELS = {
  quote:      'Daily Quote',
  top3:       "Today's Top 3",
  habits:     'Habits',
  tasks:      'On Your Plate',
  checkin:    "Today's Check-in",
  notes:      'Notes',
  countdowns: 'Countdowns',
  quicklinks: 'Quick Links',
  enjoying:   'Currently Enjoying',
  photos:     'Photos',
};

const QUOTES = [
  { text: 'You are allowed to be both a masterpiece and a work in progress simultaneously.', author: 'Sophia Bush' },
  { text: 'She believed she could, so she did.', author: 'R.S. Grey' },
  { text: 'Do it with passion or not at all.', author: 'Rosa Nouchette Carey' },
  { text: 'The most courageous act is still to think for yourself. Aloud.', author: 'Coco Chanel' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'You are enough. You have enough. You do enough.', author: 'Brené Brown' },
  { text: 'Be curious, not judgmental.', author: 'Ted Lasso' },
  { text: 'Just keep swimming.', author: 'Dory, Finding Nemo' },
  { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { text: 'We can do hard things.', author: 'Glennon Doyle' },
  { text: 'Rest is not a reward. It\'s a requirement.', author: 'Unknown' },
  { text: 'You are not a mess. You are a feeling person in a messy world.', author: 'Glennon Doyle' },
  { text: 'What is grief, if not love persevering?', author: 'Vision, WandaVision' },
  { text: 'I love deadlines. I love the whooshing noise they make as they go by.', author: 'Douglas Adams' },
  { text: 'A book is a dream you hold in your hands.', author: 'Neil Gaiman' },
  { text: 'Some days I amaze myself. Other days I put my keys in the fridge.', author: 'Unknown' },
  { text: 'I told myself I\'d just read one more chapter… three hours ago.', author: 'Every reader, always' },
  { text: 'My to-be-read pile is not a problem. It\'s a library of future joy.', author: 'Unknown' },
  { text: 'Be the main character of your own life.', author: 'Unknown' },
  { text: 'Stay close to anything that makes you glad you are alive.', author: 'Hafez' },
];


// Fixed accent colours — not theme-dependent
const LIVE_RED = '#E05252';
const WC_GREEN = '#3E8B4E';
const DUE_COLORS = {
  overdueBg:   'rgba(200,80,50,0.12)',
  overdueText: '#C85032',
  todayBg:     'rgba(200,130,50,0.12)',
  todayText:   '#C87832',
  tomorrowBg:  'rgba(196,154,42,0.12)',
};

const COUNTRY_FLAGS = {
  // UEFA (Europe)
  'Albania': '🇦🇱', 'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷',
  'Czech Republic': '🇨🇿', 'Denmark': '🇩🇰', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Finland': '🇫🇮',
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Greece': '🇬🇷', 'Hungary': '🇭🇺',
  'Ireland': '🇮🇪', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱', 'Norway': '🇳🇴',
  'Poland': '🇵🇱', 'Portugal': '🇵🇹', 'Romania': '🇷🇴', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Serbia': '🇷🇸', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮', 'Spain': '🇪🇸',
  'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Turkey': '🇹🇷', 'Türkiye': '🇹🇷',
  'Ukraine': '🇺🇦', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  // CONMEBOL (South America)
  'Argentina': '🇦🇷', 'Bolivia': '🇧🇴', 'Brazil': '🇧🇷', 'Chile': '🇨🇱',
  'Colombia': '🇨🇴', 'Ecuador': '🇪🇨', 'Paraguay': '🇵🇾', 'Peru': '🇵🇪',
  'Uruguay': '🇺🇾', 'Venezuela': '🇻🇪',
  // CONCACAF (North/Central America & Caribbean)
  'Canada': '🇨🇦', 'Costa Rica': '🇨🇷', 'Cuba': '🇨🇺', 'Curaçao': '🇨🇼',
  'Guatemala': '🇬🇹', 'Haiti': '🇭🇹', 'Honduras': '🇭🇳', 'Jamaica': '🇯🇲',
  'Mexico': '🇲🇽', 'Panama': '🇵🇦', 'Trinidad & Tobago': '🇹🇹',
  'Trinidad and Tobago': '🇹🇹', 'USA': '🇺🇸', 'United States': '🇺🇸',
  // CAF (Africa)
  'Algeria': '🇩🇿', 'Cameroon': '🇨🇲', 'Cape Verde': '🇨🇻', 'Congo': '🇨🇩',
  'DR Congo': '🇨🇩', 'Egypt': '🇪🇬', 'Ghana': '🇬🇭', 'Guinea': '🇬🇳',
  'Ivory Coast': '🇨🇮', "Côte d'Ivoire": '🇨🇮', 'Mali': '🇲🇱', 'Morocco': '🇲🇦',
  'Nigeria': '🇳🇬', 'Senegal': '🇸🇳', 'South Africa': '🇿🇦', 'Tanzania': '🇹🇿',
  'Tunisia': '🇹🇳', 'Uganda': '🇺🇬',
  // AFC (Asia)
  'Australia': '🇦🇺', 'China': '🇨🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷',
  'Iraq': '🇮🇶', 'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'New Zealand': '🇳🇿',
  'Oman': '🇴🇲', 'Qatar': '🇶🇦', 'Saudi Arabia': '🇸🇦', 'South Korea': '🇰🇷',
  'Korea Republic': '🇰🇷', 'Thailand': '🇹🇭', 'United Arab Emirates': '🇦🇪',
  'Uzbekistan': '🇺🇿',
  // OFC / other
  'Bosnia & Herzegovina': '🇧🇦', 'Bosnia and Herzegovina': '🇧🇦',
  'Russia': '🇷🇺',
};

function flagFor(name) { return COUNTRY_FLAGS[name] || '🏳️'; }

// Parse a match time like "19:00 UTC-7" into a local Date for a given date string
function parseMatchTime(dateStr, timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d+)/);
  if (!m) return null;
  const [, h, min, offset] = m;
  const utcMs = Date.UTC(
    +dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10),
    +h - +offset, +min
  );
  return new Date(utcMs);
}

// Open-Meteo WMO weather code → emoji
function weatherCodeToEmoji(code, isDay) {
  if (code === 0)                    return isDay ? '☀️' : '🌙';
  if (code <= 2)                     return isDay ? '🌤️' : '🌙';
  if (code === 3)                    return '☁️';
  if (code <= 49)                    return '🌫️';
  if (code <= 59)                    return '🌦️';
  if (code <= 67)                    return '🌧️';
  if (code <= 77)                    return '❄️';
  if (code <= 82)                    return '🌧️';
  if (code <= 86)                    return '🌨️';
  if (code <= 99)                    return '⛈️';
  return isDay ? '☀️' : '🌙';
}

function wmoDescription(code) {
  if (code === 0)          return 'Clear';
  if (code <= 2)           return 'Partly cloudy';
  if (code === 3)          return 'Overcast';
  if (code <= 49)          return 'Foggy';
  if (code <= 59)          return 'Drizzle';
  if (code <= 67)          return 'Rain';
  if (code <= 77)          return 'Snow';
  if (code <= 82)          return 'Showers';
  if (code <= 86)          return 'Snow showers';
  if (code <= 99)          return 'Thunderstorm';
  return '';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFullDate() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Extract the emoji character from a category string like "📚 Book" → "📚"
function categoryEmoji(category) {
  if (!category) return '✨';
  // Extract first emoji using segmenter if available, else regex fallback
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    for (const { segment } of seg.segment(category)) {
      if (/\p{Emoji_Presentation}/u.test(segment) || /\p{Extended_Pictographic}/u.test(segment)) {
        return segment;
      }
    }
  }
  const match = category.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
  return match ? match[0] : category.charAt(0);
}

// Return due-date chip style info based on the task's due date relative to today
function dueDateChipStyle(dueDate, C) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Overdue
    return { bg: DUE_COLORS.overdueBg, text: DUE_COLORS.overdueText };
  } else if (diffDays === 0) {
    // Today
    return { bg: DUE_COLORS.todayBg, text: DUE_COLORS.todayText };
  } else if (diffDays === 1) {
    // Tomorrow
    return { bg: DUE_COLORS.tomorrowBg, text: C.accent };
  } else {
    // Upcoming
    return { bg: C.border, text: C.textMuted };
  }
}

function formatDueLabel(dueDate) {
  if (!dueDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return due.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

export default function HomeScreen({ navigation }) {
  const { state, setState, homeEditMode, setHomeEditMode } = useApp();
  const C = useTheme();
  const [focusInput, setFocusInput] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameEditValue, setNameEditValue] = useState(state.userName || '');
  // IDs of todos just checked on the home card — shown briefly then fade from view
  const [justChecked, setJustChecked] = useState({});
  const [selectedEnjoyingItem, setSelectedEnjoyingItem] = useState(null);
  const [photoCarouselIndex, setPhotoCarouselIndex] = useState(0);
  const [worldCupMatch, setWorldCupMatch] = useState(null);
  const [worldCupDismissed, setWorldCupDismissed] = useState(false);
  const [settingsHintVisible, setSettingsHintVisible] = useState(!state.hasSeenSettingsHint);
  const settingsHintAnim = useRef(new Animated.Value(!state.hasSeenSettingsHint ? 1 : 0)).current;
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  // Calculate overdue/upcoming tasks
  const allTodos = (state.workLists || [])
    .filter((l) => !state.weekendMode || !l.isWork)
    .flatMap((l) => (state.workTodos[l.id] || []).filter((t) => !t.completed && t.dueDate));

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const overdueTodos = allTodos.filter((t) => new Date(t.dueDate) < todayMidnight);

  const shouldShowBanner = !bannerDismissed && overdueTodos.length > 0;

  const weatherCoordsRef = useRef(null); // cache geocode result so intervals skip re-geocoding
  useEffect(() => {
    weatherCoordsRef.current = null; // clear cache when location changes
    async function fetchWeather() {
      if (!state.weatherLocation) {
        setWeather(null);
        setWeatherError(false);
        return;
      }
      try {
        // Step 1: geocode only if we don't have cached coords for this location
        if (!weatherCoordsRef.current) {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(state.weatherLocation.trim())}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'GatherApp/1.0' } }
          );
          const geoData = await geoRes.json();
          if (!geoData?.length) { setWeatherError(true); setWeather(null); return; }
          weatherCoordsRef.current = { lat: geoData[0].lat, lon: geoData[0].lon };
        }
        const { lat, lon } = weatherCoordsRef.current;

        // Step 2: fetch weather from Open-Meteo (no key required)
        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=celsius`
        );
        if (!wxRes.ok) { setWeatherError(true); setWeather(null); return; }
        const wxData = await wxRes.json();
        const current = wxData.current;
        const code = current.weather_code;
        const isDay = current.is_day === 1;
        setWeather({
          emoji: weatherCodeToEmoji(code, isDay),
          temp: Math.round(current.temperature_2m),
          description: wmoDescription(code),
        });
        setWeatherError(false);
      } catch (_) {
        setWeatherError(true);
        setWeather(null);
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.weatherLocation]);

  useEffect(() => {
    if (!state.worldCupAlerts) { setWorldCupMatch(null); setWorldCupDismissed(false); return; }
    // Reset dismissed every time the toggle is turned on
    setWorldCupDismissed(false);

    async function fetchWorldCup() {
      try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
        if (!res.ok) return;
        const data = await res.json();
        const events = data.events || [];

        const live = events.find((e) => e.status?.type?.state === 'in');
        const pre  = events.find((e) => e.status?.type?.state === 'pre');
        const next = live || pre || events[0];
        if (!next) { setWorldCupMatch(null); return; }

        const isLive = next.status?.type?.state === 'in';
        const isPost = next.status?.type?.state === 'post';
        const comp        = next.competitions?.[0];
        const competitors = comp?.competitors || [];
        const home  = competitors.find((c) => c.homeAway === 'home');
        const away  = competitors.find((c) => c.homeAway === 'away');

        const match = {
          team1:        home?.team?.displayName ?? 'TBD',
          team2:        away?.team?.displayName ?? 'TBD',
          kickoff:      new Date(next.date),
          isLive,
          isPost,
          liveScore:    isLive || isPost ? [home?.score ?? 0, away?.score ?? 0] : null,
          statusDetail: next.status?.type?.shortDetail ?? '',
          displayClock: next.status?.displayClock ?? '',
          period:       next.status?.period ?? 1,
        };
        setWorldCupMatch(match);
      } catch (_) {}
    }

    fetchWorldCup();
    const interval = setInterval(fetchWorldCup, 60 * 1000);
    return () => clearInterval(interval);
  }, [state.worldCupAlerts]);

  function dismissSettingsHint() {
    Animated.timing(settingsHintAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      if (!mountedRef.current) return;
      setSettingsHintVisible(false);
      setState((s) => ({ ...s, hasSeenSettingsHint: true }));
    });
  }

  const openTodos = (state.workLists || [])
    .filter((l) => !state.weekendMode || !l.isWork)
    .flatMap((l) => (state.workTodos[l.id] || [])
      .filter((t) => !t.completed || justChecked[t.id])
      .map((t) => ({ ...t, listName: l.name, listId: l.id, listColorIndex: l.colorIndex ?? 0 })))
    .slice(0, 5);

  const todayCheckin = (state.checkIns || []).find(
    (e) => new Date(e.createdAt).toDateString() === new Date().toDateString()
  );

  // --- Habits calculations ---
  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
  const todayIsWeekend = isWeekend(new Date());
  const allHabits = state.habits || [];
  const applicableHabits = allHabits.filter((h) => !(h.frequency === 'weekday' && todayIsWeekend));
  const habitsTotal = applicableHabits.length;
  const habitsDone = applicableHabits.filter((h) => !!(state.habitLog?.[h.id]?.[today])).length;
  const habitsProgress = habitsTotal > 0 ? habitsDone / habitsTotal : 0;

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

  // --- Section renderers ---

  function renderQuoteSection() {
    if ((state.hiddenSections || []).includes('quote')) return null;
    return (
      <View style={[styles.card, styles.quoteCard]} key="quote">
        <View style={styles.quoteInner}>
          <View style={styles.quoteAccentBar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            {!!quote.author && <Text style={styles.quoteAuthor}>— {quote.author}</Text>}
          </View>
        </View>
      </View>
    );
  }

  function renderTop3Section() {
    if ((state.hiddenSections || []).includes('top3')) return null;
    return (
      <View style={styles.section} key="top3">
        <Text style={styles.sectionTitle}>TODAY'S TOP 3</Text>
        <View style={styles.card}>
          {(state.focusItems || []).map((item) => {
            const itemKey = item.id ?? item.text;
            return (
            <View key={itemKey} style={styles.focusRow}>
              <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => toggleFocusItem(itemKey)}>
                <View style={[styles.focusCheck, item.done && styles.focusCheckDone]}>
                  {item.done && <Text style={styles.focusCheckMark}>✓</Text>}
                </View>
                <Text style={[styles.focusText, item.done && styles.focusTextDone]}>{item.text}</Text>
              </Pressable>
              <TouchableOpacity onPress={() => deleteFocusItem(itemKey)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16, color: C.textFaint }}>×</Text>
              </TouchableOpacity>
            </View>
          )})}
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
    );
  }

  function renderTasksSection() {
    if ((state.hiddenSections || []).includes('tasks')) return null;
    return (
      <View style={styles.section} key="tasks">
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
            openTodos.map((t) => {
              const chipStyle = t.dueDate ? dueDateChipStyle(t.dueDate, C) : null;
              const dueLabel = t.dueDate ? formatDueLabel(t.dueDate) : null;
              const isChecked = t.completed || justChecked[t.id];
              const badgeColor = LIST_BADGE_COLORS[t.listColorIndex ?? 0];
              const badgeLetter = (t.listName || '?').charAt(0).toUpperCase();
              return (
                <Pressable key={t.id} style={[styles.todoRow, isChecked && { opacity: 0.5 }]} onPress={() => toggleTodo(t.listId, t.id)}>
                  <View style={[styles.check, isChecked && styles.checkDone]}>
                    {isChecked && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={[styles.listBadge, { backgroundColor: badgeColor.bg }]}>
                    <Text style={[styles.listBadgeLetter, { color: badgeColor.text }]}>{badgeLetter}</Text>
                  </View>
                  <View style={styles.todoTextGroup}>
                    <Text style={[styles.todoText, isChecked && styles.todoTextDone]}>{t.text}</Text>
                  </View>
                  {chipStyle && dueLabel && !isChecked && (
                    <View style={[styles.dueDateChip, { backgroundColor: chipStyle.bg }]}>
                      <Text style={[styles.dueDateChipText, { color: chipStyle.text }]}>{dueLabel}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </View>
    );
  }

  function renderCheckinSection() {
    if ((state.hiddenSections || []).includes('checkin')) return null;
    return (
      <View style={styles.section} key="checkin">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S CHECK-IN</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Journal')}>
            <Text style={styles.seeAll}>{todayCheckin ? 'View' : 'Write one'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {todayCheckin ? (
            <>
              <View style={styles.checkinMeta}>
                {!!todayCheckin.mood && <Text style={styles.checkinMoodEmoji}>{todayCheckin.mood}</Text>}
                <Text style={styles.checkinDate}>
                  {new Date(todayCheckin.createdAt).toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.checkinPreview} numberOfLines={3}>{todayCheckin.body}</Text>
            </>
          ) : (
            <Text style={styles.empty}>No check-in yet today.</Text>
          )}
        </View>
      </View>
    );
  }

  function renderHabitsSection() {
    if ((state.hiddenSections || []).includes('habits')) return null;
    return (
      <View style={styles.section} key="habits">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>HABITS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Habits')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {habitsTotal === 0 ? (
            <>
              <Text style={styles.empty}>No habits yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Habits')} style={{ marginTop: 8 }}>
                <Text style={styles.seeAll}>Set some up →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {applicableHabits.map((habit) => {
                const done = !!(state.habitLog?.[habit.id]?.[today]);
                return (
                  <Pressable key={habit.id} style={[styles.todoRow, done && { opacity: 0.5 }]} onPress={() => toggleHabit(habit.id)}>
                    <View style={[styles.check, done && styles.checkDone]}>
                      {done && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={[styles.todoText, done && styles.todoTextDone]}>
                      {habit.emoji ? `${habit.emoji} ` : ''}{habit.name}
                    </Text>
                  </Pressable>
                );
              })}
              {/* Progress bar */}
              <View style={[styles.habitsBarTrack, { marginTop: 10 }]}>
                <View style={[styles.habitsBarFill, { width: `${Math.round(habitsProgress * 100)}%` }]} />
              </View>
              <View style={styles.habitsCountRow}>
                <Text style={styles.habitsCount}>{habitsDone}/{habitsTotal}</Text>
                <Text style={styles.habitsCountLabel}> today</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  function renderNotesSection() {
    if ((state.hiddenSections || []).includes('notes')) return null;
    const recentNotes = (state.notesList || []).slice(0, 3);
    return (
      <View style={styles.section} key="notes">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NOTES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notes')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {/* Quick-create row */}
          <TouchableOpacity
            style={styles.noteQuickCreate}
            onPress={() => {
              const note = { id: generateId(), title: '', body: '', updatedAt: new Date().toISOString() };
              setState(s => ({ ...s, notesList: [note, ...(s.notesList || [])] }));
              navigation.navigate('Notes', { openId: note.id });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={18} color={C.accent} />
            <Text style={[styles.noteQuickCreateText, { color: C.accent }]}>New note…</Text>
          </TouchableOpacity>

          {recentNotes.length > 0 && (
            <View style={{ marginTop: 8, gap: 2 }}>
              {recentNotes.map((note) => {
                const preview = (note.body || '').replace(/\[msn:[^\]]+\]/g, '').replace(/\*\*|_/g, '').slice(0, 60);
                const d = note.updatedAt ? new Date(note.updatedAt) : null;
                const dateLabel = d && !isNaN(d) ? d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) : '';
                return (
                  <TouchableOpacity
                    key={note.id}
                    style={styles.notePreviewRow}
                    onPress={() => navigation.navigate('Notes', { openId: note.id })}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notePreviewTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                      {!!preview && <Text style={styles.notePreviewBody} numberOfLines={1}>{preview}</Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {!!dateLabel && <Text style={styles.notePreviewDate}>{dateLabel}</Text>}
                      <Ionicons name="chevron-forward" size={14} color={C.textFaint} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderCountdownsSection() {
    if ((state.hiddenSections || []).includes('countdowns')) return null;
    const countdowns = (state.countdowns || []).slice(0, 5);
    return (
      <View style={styles.section} key="countdowns">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>COUNTDOWNS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Countdowns')}>
            <Text style={styles.seeAll}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {countdowns.length === 0 ? (
            <>
              <Text style={styles.empty}>No countdowns yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Countdowns')} style={{ marginTop: 8 }}>
                <Text style={styles.seeAll}>Add one →</Text>
              </TouchableOpacity>
            </>
          ) : (
            countdowns.map((cd) => {
              const daysAway = Math.round(
                (new Date(cd.date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
                (1000 * 60 * 60 * 24)
              );
              let daysLabel;
              let daysStyle;
              if (daysAway === 0) {
                daysLabel = 'Today!';
                daysStyle = [styles.countdownDays, { fontFamily: F.heading }];
              } else if (daysAway > 0) {
                daysLabel = `${daysAway} day${daysAway === 1 ? '' : 's'} away`;
                daysStyle = styles.countdownDays;
              } else {
                daysLabel = `${Math.abs(daysAway)} day${Math.abs(daysAway) === 1 ? '' : 's'} overdue`;
                daysStyle = styles.countdownDaysOverdue;
              }
              return (
                <View key={cd.id} style={styles.countdownRow}>
                  <Text style={styles.countdownLabel} numberOfLines={1}>{cd.label || cd.name || cd.title}</Text>
                  <Text style={daysStyle}>{daysLabel}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  }

  function renderQuickLinksSection() {
    if ((state.hiddenSections || []).includes('quicklinks')) return null;
    const quickLinks = state.quickLinks || [];
    return (
      <View style={styles.section} key="quicklinks">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK LINKS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('QuickLinks')}>
            <Text style={styles.seeAll}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {quickLinks.length === 0 ? (
            <>
              <Text style={styles.empty}>No links yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('QuickLinks')} style={{ marginTop: 8 }}>
                <Text style={styles.seeAll}>Add one →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.quickLinksWrap}>
              {quickLinks.map((link) => (
                <TouchableOpacity
                  key={link.id}
                  style={styles.quickLinkPill}
                  onPress={() => {
                    const url = link.url;
                    if (!url.startsWith('https://') && !url.startsWith('http://')) return;
                    Linking.openURL(url).catch(() => {});
                  }}
                >
                  <Text style={styles.quickLinkText}>{link.label || link.title || link.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderEnjoyingSection() {
    const hiddenKeys = state.hiddenSections || [];
    if (hiddenKeys.includes('enjoying') || hiddenKeys.includes('consuming')) return null;

    const items = (state.currentlyConsuming || [])
      .filter((i) => (i.status || 'current') === 'current')
      .slice(0, 6);

    return (
      <View style={styles.section} key="enjoying">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CURRENTLY ENJOYING</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Hobbies')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {items.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>Nothing added yet.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.enjoyingScroll}
          >
            {items.map((item) => (
              <TouchableOpacity key={item.id} style={styles.enjoyingCard} onPress={() => setSelectedEnjoyingItem(item)} activeOpacity={0.8}>
                <View style={styles.enjoyingCover}>
                  {item.coverUri ? (
                    <Image source={{ uri: item.coverUri }} style={styles.enjoyingCoverImage} />
                  ) : (
                    <Text style={styles.enjoyingEmoji}>{categoryEmoji(item.category)}</Text>
                  )}
                </View>
                <View style={styles.enjoyingLabel}>
                  <Text style={styles.enjoyingTitle} numberOfLines={1} ellipsizeMode="tail">
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  function renderPhotosSection() {
    if ((state.hiddenSections || []).includes('photos')) return null;
    const photos = (state.photos || []).slice(0, 20);
    const carouselWidth = Dimensions.get('window').width - 40;
    return (
      <View style={styles.section} key="photos">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PHOTOS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Photos')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {photos.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>No photos yet.</Text>
          </View>
        ) : (
          <View>
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, i) => item.id || String(i)}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
                setPhotoCarouselIndex(idx);
              }}
              renderItem={({ item }) => {
                const uri = typeof item === 'string' ? item : (item.src || item.uri);
                return (
                  <TouchableOpacity onPress={() => navigation.navigate('Photos')} activeOpacity={0.92}>
                    <Image source={{ uri }} style={[styles.carouselImage, { width: carouselWidth }]} />
                    {!!item.caption && (
                      <View style={styles.carouselCaption}>
                        <Text style={styles.carouselCaptionText} numberOfLines={2}>{item.caption}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              style={{ borderRadius: RADIUS.lg, overflow: 'hidden' }}
            />
            {photos.length > 1 && (
              <View style={styles.carouselDots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.carouselDot, i === photoCarouselIndex && styles.carouselDotActive]} />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // Map section keys to renderers — 'work' and 'tasks' are the same section;
  // 'consuming' and 'enjoying' are the same section (backward compat)
  const sectionRenderers = {
    quote:      renderQuoteSection,
    top3:       renderTop3Section,
    tasks:      renderTasksSection,
    work:       renderTasksSection,   // backward compat alias
    checkin:    renderCheckinSection,
    habits:     renderHabitsSection,
    notes:      renderNotesSection,
    countdowns: renderCountdownsSection,
    quicklinks: renderQuickLinksSection,
    enjoying:   renderEnjoyingSection,
    consuming:  renderEnjoyingSection, // backward compat alias
    photos:     renderPhotosSection,
  };

  // --- Event handlers ---

  function handleNameEdit() {
    const trimmed = nameEditValue.trim();
    if (trimmed) {
      setState((s) => ({ ...s, userName: trimmed }));
      setNameEditValue(trimmed);
    } else {
      setNameEditValue(state.userName || '');
    }
    setEditingName(false);
  }

  function handleCancelNameEdit() {
    setEditingName(false);
    setNameEditValue(state.userName || '');
  }

  function addFocusItem() {
    const text = focusInput.trim();
    if (!text || (state.focusItems || []).length >= 3) return;
    setState((s) => ({ ...s, focusItems: [...(s.focusItems || []), { id: generateId(), text, done: false }] }));
    setFocusInput('');
  }

  function toggleFocusItem(id) {
    setState((s) => ({
      ...s,
      focusItems: (s.focusItems || []).map((f) => (f.id ?? f.text) === id ? { ...f, done: !f.done } : f),
    }));
  }

  function deleteFocusItem(id) {
    setState((s) => ({
      ...s,
      focusItems: (s.focusItems || []).filter((f) => (f.id ?? f.text) !== id),
    }));
  }

  function toggleTodo(listId, todoId) {
    const todo = (state.workTodos[listId] || []).find((t) => t.id === todoId);
    const completing = !todo?.completed;
    setState((s) => {
      const todos = (s.workTodos[listId] || []).map((t) =>
        t.id === todoId ? { ...t, completed: completing, completedAt: completing ? new Date().toISOString() : null } : t
      );
      return { ...s, workTodos: { ...s.workTodos, [listId]: todos } };
    });
    if (completing) {
      setJustChecked((prev) => ({ ...prev, [todoId]: true }));
      setTimeout(() => {
        setJustChecked((prev) => { const next = { ...prev }; delete next[todoId]; return next; });
      }, 1200);
    }
  }

  // Resolve the ordered section keys, falling back to homeCardOrder default, then
  // legacy sectionOrder so old installs keep working
  const orderedKeys = state.homeCardOrder
    || state.sectionOrder
    || ['quote', 'top3', 'habits', 'tasks', 'checkin', 'notes', 'countdowns', 'quicklinks', 'enjoying', 'photos'];

  // Deduplicate — 'work'/'tasks' and 'enjoying'/'consuming' aliases could appear twice
  const seenSections = new Set();
  const deduplicatedKeys = orderedKeys.filter((key) => {
    // Normalise aliases to a canonical key for dedup tracking
    const canonical = (key === 'work') ? 'tasks' : (key === 'consuming') ? 'enjoying' : key;
    if (seenSections.has(canonical)) return false;
    seenSections.add(canonical);
    return true;
  });

  // ── Home edit mode: build draggable item list from current ordered keys ──
  const editableCards = useMemo(() => {
    const hidden = state.hiddenSections || [];
    return deduplicatedKeys
      .filter((key) => HOME_CARD_LABELS[key] && !hidden.includes(key))
      .map((key) => ({ key, label: HOME_CARD_LABELS[key] || key }));
  }, [deduplicatedKeys, state.hiddenSections]);

  if (homeEditMode) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={[]}>
        <View style={styles.editModeHeader}>
          <Text style={styles.editModeTitle}>Reorder Cards</Text>
          <Text style={styles.editModeHint}>Long-press a card to start dragging</Text>
        </View>
        <DraggableFlatList
          data={editableCards}
          keyExtractor={(item) => item.key}
          onDragEnd={({ data }) => {
            setState((s) => {
              const reordered = data.map((d) => d.key);
              // Re-append any hidden cards that were excluded from the drag list
              // so they aren't permanently lost from homeCardOrder
              const hidden = s.hiddenSections || [];
              const currentOrder = s.homeCardOrder || [];
              const hiddenInOrder = currentOrder.filter((k) => hidden.includes(k) && !reordered.includes(k));
              return { ...s, homeCardOrder: [...reordered, ...hiddenInOrder] };
            });
          }}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <TouchableOpacity
                style={[
                  styles.editCardRow,
                  { backgroundColor: isActive ? (C.accentLight || C.border) : C.bgCard, borderBottomColor: C.border },
                ]}
                onLongPress={() => { Vibration.vibrate(40); drag(); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.editCardHandle, { color: C.textMuted }]}>⠿</Text>
                <Text style={[styles.editCardLabel, { color: C.text }]}>{item.label}</Text>
              </TouchableOpacity>
            </ScaleDecorator>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        <View style={[styles.editDoneBar, { backgroundColor: C.bg, borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[styles.editDoneBtn, { backgroundColor: C.accent }]}
            onPress={() => setHomeEditMode(false)}
            accessibilityLabel="Done editing home"
          >
            <Text style={styles.editDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingDate}>{greeting()} — {getFullDate()}</Text>
            </View>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameEditInput}
                  placeholder="Your name…"
                  placeholderTextColor={C.textFaint}
                  value={nameEditValue}
                  onChangeText={setNameEditValue}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleNameEdit}
                />
                <TouchableOpacity style={styles.nameEditSave} onPress={handleNameEdit}>
                  <Text style={styles.nameEditBtnText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nameEditCancel} onPress={handleCancelNameEdit}>
                  <Text style={styles.nameEditBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Text style={styles.name}>{state.userName || 'There'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {weather && (
            <View style={styles.weatherPill}>
              <Text style={styles.weatherPillText}>{weather.emoji}  {weather.temp}°  {weather.description}</Text>
            </View>
          )}
        </View>

        {/* Overdue/Urgent Banner */}
        {shouldShowBanner && (
          <View style={styles.bannerContainer}>
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                {`${overdueTodos.length} task${overdueTodos.length > 1 ? 's' : ''} need attention`}
              </Text>
              <TouchableOpacity onPress={() => setBannerDismissed(true)} style={styles.bannerClose}>
                <Text style={styles.bannerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* World Cup Banner */}
        {state.worldCupAlerts && worldCupMatch && !worldCupDismissed && (() => {
          const { team1, team2, kickoff, isLive, isPost, liveScore, statusDetail, displayClock, period } = worldCupMatch;

          // Header line
          let headerLine;
          if (isLive) {
            let periodLabel = '';
            if (statusDetail.toLowerCase().includes('halftime') || statusDetail.toLowerCase().includes('half time')) {
              periodLabel = 'Half Time';
            } else if (period >= 3) {
              periodLabel = displayClock ? `ET ${displayClock}` : 'Extra Time';
            } else {
              periodLabel = displayClock ? `${displayClock}` : (period === 1 ? '1st Half' : '2nd Half');
            }
            headerLine = `🔴 LIVE · ${periodLabel}`;
          } else if (isPost) {
            headerLine = '⚽ FIFA WORLD CUP 2026 · Full Time';
          } else {
            const minsAway = Math.round((kickoff.getTime() - Date.now()) / 60000);
            const dateLabel = kickoff.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr   = kickoff.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
            const countdown = minsAway < 60
              ? `in ${minsAway}m`
              : minsAway < 1440
                ? `in ${Math.floor(minsAway / 60)}h ${minsAway % 60}m`
                : `in ${Math.floor(minsAway / 1440)} days`;
            headerLine = `⚽ FIFA WORLD CUP 2026 · ${dateLabel} ${timeStr} · ${countdown}`;
          }

          return (
            <View style={styles.wcBanner}>
              <View style={[styles.wcAccentBar, (isLive) && { backgroundColor: LIVE_RED }]} />
              <View style={styles.wcContent}>
                <Text style={[styles.wcHeader, isLive && { color: LIVE_RED }]}>{headerLine}</Text>
                <View style={styles.wcMatchRow}>
                  <Text style={styles.wcTeam}>{flagFor(team1)} <Text style={styles.wcTeamName}>{team1}</Text></Text>
                  {liveScore
                    ? <Text style={[styles.wcScore, { color: isLive ? LIVE_RED : C.text }]}>{liveScore[0]} – {liveScore[1]}</Text>
                    : <Text style={styles.wcVs}>vs</Text>
                  }
                  <Text style={styles.wcTeam}>{flagFor(team2)} <Text style={styles.wcTeamName}>{team2}</Text></Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { setWorldCupDismissed(true); setTimeout(() => setWorldCupDismissed(false), 5 * 60 * 1000); }} style={styles.wcClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.wcCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Settings hint — shown once after onboarding */}
        {settingsHintVisible && (
          <Animated.View style={[styles.settingsHint, { opacity: settingsHintAnim }]}>
            <Text style={styles.settingsHintText}>⚙️  Tip: customise your themes, fonts, and cards in <Text style={styles.settingsHintBold}>Settings</Text></Text>
            <TouchableOpacity onPress={dismissSettingsHint} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.settingsHintClose}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Render sections in homeCardOrder, skipping hidden ones */}
        {deduplicatedKeys.map((sectionKey) => {
          const renderer = sectionRenderers[sectionKey];
          return renderer ? renderer() : null;
        })}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Currently Enjoying detail sheet */}
      <BottomSheet visible={!!selectedEnjoyingItem} onClose={() => setSelectedEnjoyingItem(null)} backgroundColor={C.bg}>
        {selectedEnjoyingItem && (
          <ScrollView contentContainerStyle={styles.enjoyingDetail} showsVerticalScrollIndicator={false}>
            {/* Cover */}
            <View style={styles.enjoyingDetailCover}>
              {selectedEnjoyingItem.coverUri ? (
                <Image source={{ uri: selectedEnjoyingItem.coverUri }} style={styles.enjoyingDetailCoverImage} />
              ) : (
                <Text style={styles.enjoyingDetailEmoji}>{categoryEmoji(selectedEnjoyingItem.category)}</Text>
              )}
            </View>
            {/* Title + creator */}
            <Text style={styles.enjoyingDetailTitle}>{selectedEnjoyingItem.title}</Text>
            {selectedEnjoyingItem.creator ? (
              <Text style={styles.enjoyingDetailCreator}>{selectedEnjoyingItem.creator}</Text>
            ) : null}
            {/* Category badge */}
            <View style={styles.enjoyingDetailBadge}>
              <Text style={styles.enjoyingDetailBadgeText}>{selectedEnjoyingItem.category || 'Other'}</Text>
            </View>
            {/* Star rating */}
            {selectedEnjoyingItem.rating > 0 && (
              <View style={styles.enjoyingDetailStars}>
                {[1,2,3,4,5].map((star) => (
                  <Text key={star} style={[styles.enjoyingDetailStar, { color: star <= selectedEnjoyingItem.rating ? C.accent : C.border }]}>
                    {star <= selectedEnjoyingItem.rating ? '★' : '☆'}
                  </Text>
                ))}
              </View>
            )}
            {/* Review / notes */}
            {selectedEnjoyingItem.review ? (
              <View style={styles.enjoyingDetailReviewBox}>
                <Text style={styles.enjoyingDetailReviewLabel}>NOTES</Text>
                <Text style={styles.enjoyingDetailReview}>{selectedEnjoyingItem.review}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:             { flex: 1, backgroundColor: C.bg },
    scroll:           { flex: 1 },
    content:          { padding: 20 },
    header:           { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
    weatherPill:      { alignSelf: 'flex-end', marginBottom: 4 },
    weatherPillText:  { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    greetingRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
    greetingDate:     { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    name:             { fontSize: 36, fontFamily: F.heading, color: C.text },
    nameEditRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    nameEditInput:    { flex: 1, fontSize: 28, fontFamily: F.heading, color: C.text, paddingVertical: 4 },
    nameEditSave:     { padding: 8, alignItems: 'center', justifyContent: 'center' },
    nameEditCancel:   { padding: 8, alignItems: 'center', justifyContent: 'center' },
    nameEditBtnText:  { fontSize: 20, color: C.accent, fontFamily: F.heading },
    card:             { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: C.border, ...SHADOW.card },
    quoteCard:        { marginBottom: 24 },
    quoteInner:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    quoteAccentBar:   { width: 3, height: 40, borderRadius: 2, backgroundColor: C.accent },
    quoteText:        { fontSize: 14, fontFamily: F.italic || F.body, color: C.text, lineHeight: 22 },
    quoteAuthor:      { fontSize: 12, fontFamily: F.body, color: C.textMuted, marginTop: 6 },
    // Banner
    bannerContainer:  { marginBottom: 16 },
    banner:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(200,80,50,0.08)', borderWidth: 1, borderColor: 'rgba(200,80,50,0.18)', borderRadius: RADIUS.md, padding: 12 },
    bannerText:       { flex: 1, fontSize: 12, color: '#C85032', fontFamily: F.body },
    bannerClose:      { padding: 6 },
    bannerCloseText:  { fontSize: 16, color: '#C85032', fontFamily: F.heading },
    wcBanner:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden', ...SHADOW.card },
    wcAccentBar:      { width: 4, alignSelf: 'stretch', backgroundColor: WC_GREEN },
    wcContent:        { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
    wcHeader:         { fontSize: 10, fontFamily: F.heading, color: C.textMuted, letterSpacing: 0.6, marginBottom: 6 },
    wcMatchRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    wcTeam:           { fontSize: 13, fontFamily: F.body, color: C.text },
    wcTeamName:       { fontFamily: F.heading, color: C.text },
    wcVs:             { fontSize: 12, color: C.textMuted, fontFamily: F.body },
    wcScore:          { fontSize: 15, fontFamily: F.heading, color: C.text },
    wcTimeLabel:      { fontSize: 12, fontFamily: F.body, color: C.accent, marginLeft: 4 },
    wcClose:          { paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
    wcCloseText:      { fontSize: 16, color: C.textFaint },
    settingsHint:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accentLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.accent, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, gap: 10 },
    settingsHintText: { flex: 1, fontSize: 13, fontFamily: F.body, color: C.accent, lineHeight: 19 },
    settingsHintBold: { fontFamily: F.heading, color: C.accent },
    settingsHintClose:{ fontSize: 16, color: C.accent },
    section:          { marginBottom: 20 },
    sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sectionTitle:     { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8, marginBottom: 8 },
    seeAll:           { fontSize: 13, color: C.accent, fontFamily: F.heading },
    empty:            { fontSize: 14, color: C.textFaint, fontFamily: F.body },
    // Focus items
    focusRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
    focusCheck:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    focusCheckDone:   { backgroundColor: C.accent, borderColor: C.accent },
    focusCheckMark:   { color: '#fff', fontSize: 12, lineHeight: 14, fontFamily: F.heading, textAlignVertical: 'center', includeFontPadding: false },
    focusText:        { fontSize: 14, color: C.text, flex: 1, fontFamily: F.body },
    focusTextDone:    { textDecorationLine: 'line-through', color: C.textMuted },
    focusInputRow:    { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, marginTop: 4 },
    focusInput:       { fontSize: 14, color: C.text, paddingVertical: 4, fontFamily: F.body },
    // Todos
    todoRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    check:            { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    checkDone:        { backgroundColor: C.accent, borderColor: C.accent },
    checkMark:        { color: '#fff', fontSize: 11, fontFamily: F.heading },
    listBadge:        { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    listBadgeLetter:  { fontSize: 12, fontFamily: F.heading },
    todoTextGroup:    { flex: 1 },
    todoText:         { fontSize: 14, color: C.text, fontFamily: F.body },
    todoTextDone:     { textDecorationLine: 'line-through', color: C.textMuted },
    dueDateChip:      { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    dueDateChipText:  { fontSize: 11, fontFamily: F.heading },
    // Checkin
    checkinMeta:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    checkinMoodEmoji: { fontSize: 20 },
    checkinDate:      { fontSize: 12, color: C.textMuted, fontFamily: F.body },
    checkinPreview:   { fontSize: 14, color: C.text, lineHeight: 22, fontFamily: F.body },
    // Habits
    habitsCountRow:   { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
    habitsCount:      { fontSize: 13, fontFamily: F.body, color: C.textMuted },
    habitsCountLabel: { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    habitsBarTrack:   { height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' },
    habitsBarFill:    { height: 6, borderRadius: 3, backgroundColor: C.accent },
    // Notes preview
    noteQuickCreate:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', paddingHorizontal: 12 },
    noteQuickCreateText: { fontSize: 14, fontFamily: F.body },
    notePreviewRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border, gap: 8 },
    notePreviewTitle: { fontSize: 14, fontFamily: F.heading, color: C.text },
    notePreviewBody:  { fontSize: 12, color: C.textMuted, fontFamily: F.body, marginTop: 1 },
    notePreviewDate:  { fontSize: 11, color: C.textFaint, fontFamily: F.body, flexShrink: 0 },
    // Countdowns
    countdownRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
    countdownLabel:   { fontSize: 14, color: C.text, flex: 1, marginRight: 12, fontFamily: F.body },
    countdownDays:    { fontSize: 13, color: C.accent, fontFamily: F.body },
    countdownDaysOverdue: { fontSize: 13, color: C.danger, fontFamily: F.body },
    // Quick links
    quickLinksWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    quickLinkPill:    { borderWidth: 1.5, borderColor: C.accent, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
    quickLinkText:    { fontSize: 13, color: C.accent, fontFamily: F.body },
    // Enjoying
    enjoyingScroll:   { paddingRight: 4 },
    enjoyingCard:     { width: 88, borderRadius: 10, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginRight: 8, ...SHADOW.card },
    enjoyingCover:    { width: 88, height: 120, backgroundColor: C.accentLight || C.border, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
    enjoyingCoverImage: { width: 88, height: 120 },
    enjoyingEmoji:    { fontSize: 28 },
    enjoyingLabel:    { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
    enjoyingTitle:    { fontSize: 11, color: C.text, textAlign: 'center', fontFamily: F.heading },
    // Enjoying detail sheet
    enjoyingDetail:       { paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
    enjoyingDetailCover:  { width: 140, height: 200, borderRadius: RADIUS.lg, backgroundColor: C.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
    enjoyingDetailCoverImage: { width: 140, height: 200 },
    enjoyingDetailEmoji:  { fontSize: 52 },
    enjoyingDetailTitle:  { fontSize: 22, fontFamily: F.heading, color: C.text, textAlign: 'center', marginBottom: 6 },
    enjoyingDetailCreator:{ fontSize: 15, fontFamily: F.body, color: C.textMuted, textAlign: 'center', marginBottom: 12 },
    enjoyingDetailBadge:  { backgroundColor: C.accentLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
    enjoyingDetailBadgeText: { fontSize: 12, fontFamily: F.heading, color: C.accent },
    enjoyingDetailStars:      { flexDirection: 'row', gap: 4, marginBottom: 16 },
    enjoyingDetailStar:       { fontSize: 22 },
    enjoyingDetailReviewBox:  { width: '100%', backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
    enjoyingDetailReviewLabel:{ fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8, marginBottom: 6 },
    enjoyingDetailReview:     { fontSize: 14, fontFamily: F.body, color: C.text, lineHeight: 22 },
    // Photos
    carouselImage:    { height: 220, borderRadius: RADIUS.lg, backgroundColor: C.border },
    carouselCaption:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 8, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },
    carouselCaptionText: { color: '#fff', fontSize: 12, fontFamily: F.body },
    carouselDots:     { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
    carouselDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
    carouselDotActive:{ backgroundColor: C.accent, width: 16 },
    // ── Home edit mode ──
    editModeHeader:   { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    editModeTitle:    { fontSize: 26, fontFamily: F.heading, color: C.text, marginBottom: 4 },
    editModeHint:     { fontSize: 13, fontFamily: F.body, color: C.textMuted },
    editCardRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    editCardHandle:   { fontSize: 20, marginRight: 16, width: 24, textAlign: 'center' },
    editCardLabel:    { flex: 1, fontSize: 15, fontFamily: F.body },
    editDoneBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
    editDoneBtn:      { borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    editDoneBtnText:  { color: '#fff', fontSize: 16, fontFamily: F.heading },
  });
}
