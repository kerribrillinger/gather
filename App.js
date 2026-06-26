import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Pressable, Animated, ScrollView, PanResponder, Vibration,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { AppProvider, useApp, useTheme, useFont } from './src/AppContext';
import { AppAlertProvider } from './src/AppAlert';
import { ToastContainer } from './src/Toast';
import WelcomeScreen    from './src/screens/WelcomeScreen';
import HomeScreen       from './src/screens/HomeScreen';
import JournalScreen    from './src/screens/JournalScreen';
import TasksScreen      from './src/screens/TasksScreen';
import HabitsScreen     from './src/screens/HabitsScreen';
import NotesScreen      from './src/screens/NotesScreen';
import HobbiesScreen    from './src/screens/HobbiesScreen';
import CountdownsScreen from './src/screens/CountdownsScreen';
import QuickLinksScreen from './src/screens/QuickLinksScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import PhotosScreen     from './src/screens/PhotosScreen';

// ─── All screen icon definitions ────────────────────────────────────────────
const ALL_SCREEN_ICONS = {
  Home:       { icon: 'home-outline',            iconActive: 'home',              label: 'Home'        },
  Journal:    { icon: 'journal-outline',         iconActive: 'journal',           label: 'Journal'     },
  Tasks:      { icon: 'list-outline',            iconActive: 'list',              label: 'Tasks'       },
  Habits:     { icon: 'checkbox-outline',        iconActive: 'checkbox',          label: 'Habits'      },
  Notes:      { icon: 'document-text-outline',   iconActive: 'document-text',     label: 'Notes'       },
  Hobbies:    { icon: 'heart-outline',           iconActive: 'heart',             label: 'Hobbies'     },
  Photos:     { icon: 'images-outline',          iconActive: 'images',            label: 'Photos'      },
  Countdowns: { icon: 'timer-outline',           iconActive: 'timer',             label: 'Countdowns'  },
  QuickLinks: { icon: 'link-outline',            iconActive: 'link',              label: 'Quick Links' },
  Settings:   { icon: 'settings-outline',        iconActive: 'settings',          label: 'Settings'    },
};

const MORE_GROUPS = [
  {
    label: 'DAILY',
    items: [
      { name: 'Notes',   icon: 'document-text-outline', label: 'Notes'   },
      { name: 'Journal', icon: 'journal-outline',       label: 'Journal' },
      { name: 'Habits',  icon: 'checkbox-outline',       label: 'Habits'  },
    ],
  },
  {
    label: 'FOCUS',
    items: [
      { name: 'Tasks', icon: 'list-outline', label: 'Tasks' },
    ],
  },
  {
    label: 'LIFE',
    items: [
      { name: 'Hobbies',    icon: 'heart-outline',   label: 'Hobbies'     },
      { name: 'Photos',     icon: 'images-outline',  label: 'Photos'      },
      { name: 'Countdowns', icon: 'timer-outline',   label: 'Countdowns'  },
      { name: 'QuickLinks', icon: 'link-outline',    label: 'Quick Links' },
    ],
  },
  {
    label: 'APP',
    items: [
      { name: 'Settings', icon: 'settings-outline', label: 'Settings' },
    ],
  },
];

// ─── Screen map ─────────────────────────────────────────────────────────────
const SCREENS = {
  Home:       HomeScreen,
  Journal:    JournalScreen,
  Tasks:      TasksScreen,
  Habits:     HabitsScreen,
  Notes:      NotesScreen,
  Hobbies:    HobbiesScreen,
  Photos:     PhotosScreen,
  Countdowns: CountdownsScreen,
  QuickLinks: QuickLinksScreen,
  Settings:   SettingsScreen,
};

// ─── Header ─────────────────────────────────────────────────────────────────
function GatherHeader({ C, isDark, onToggleTheme, showEditBtn, onEditHome }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { backgroundColor: C.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.headerLogo}>
        <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
          <Circle cx={10} cy={10} r={8} fill="#EDD9A3" />
          <Circle cx={18} cy={10} r={8} fill="#C9A84C" opacity={0.85} />
          <Circle cx={10} cy={18} r={8} fill="#C9A84C" opacity={0.7} />
          <Circle cx={18} cy={18} r={8} fill="#EDD9A3" opacity={0.6} />
        </Svg>
      </View>
      <View style={styles.headerActions}>
        {showEditBtn && (
          <TouchableOpacity style={styles.headerIconBtn} onPress={onEditHome}>
            <Ionicons name="create-outline" size={20} color={C.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.headerIconBtn} onPress={onToggleTheme}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Custom tab bar ──────────────────────────────────────────────────────────
function CustomTabBar({ activeScreen, onPress, onMorePress, C, pinnedTabs }) {
  const insets = useSafeAreaInsets();
  const F = useFont();
  // Home is always first, then up to 3 pinned tabs
  const tabs = [
    'Home',
    ...( pinnedTabs || ['Journal', 'Tasks', 'Habits'] ),
  ].slice(0, 4);

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: C.bgNav ?? '#4A5040',
        paddingBottom: insets.bottom,
        borderTopColor: 'rgba(255,255,255,0.06)',
      }
    ]}>
      {tabs.map((name) => {
        const tab = ALL_SCREEN_ICONS[name];
        if (!tab) return null;
        const isActive = activeScreen === name;
        const color = isActive ? '#fff' : 'rgba(255,255,255,0.5)';
        return (
          <TouchableOpacity
            key={name}
            style={styles.tabItem}
            onPress={() => onPress(name)}
            activeOpacity={0.7}
          >
            <Ionicons name={isActive ? tab.iconActive : tab.icon} size={22} color={color} />
            <Text style={[styles.tabLabel, { color, fontFamily: isActive ? F.heading : F.body }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      {/* More tab */}
      <TouchableOpacity style={styles.tabItem} onPress={onMorePress} activeOpacity={0.7}>
        <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color="rgba(255,255,255,0.5)" />
        <Text style={[styles.tabLabel, { color: 'rgba(255,255,255,0.5)', fontFamily: F.body }]}>
          More
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── More sheet ──────────────────────────────────────────────────────────────
function MoreSheet({ visible, onClose, onNavigate, C, currentScreen }) {
  const { state, setState } = useApp();
  const F = useFont();
  const pinnedTabs = state?.pinnedTabs || ['Journal', 'Tasks', 'Habits'];
  const bgNav = C.bgNav ?? '#4A5040';
  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => { translateY.setValue(600); onClose(); });
  }

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      if (gs.dy > 0) {
        translateY.setValue(gs.dy);
        backdropOpacity.setValue(Math.max(0, 1 - gs.dy / 300));
      }
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dy > 60 || gs.vy > 0.5) {
        dismiss();
      } else {
        Animated.parallel([
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.timing(backdropOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    },
  })).current;

  function togglePin(itemName) {
    const isPinned = pinnedTabs.includes(itemName);
    if (isPinned) {
      setState((s) => ({ ...s, pinnedTabs: (s.pinnedTabs || []).filter((n) => n !== itemName) }));
    } else {
      if (pinnedTabs.length >= 3) return;
      setState((s) => ({ ...s, pinnedTabs: [...(s.pinnedTabs || []), itemName] }));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity }]} pointerEvents="none" />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[styles.sheet, { backgroundColor: bgNav, transform: [{ translateY }] }]}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.sheetHandleArea} {...pan.panHandlers}>
              <View style={[styles.sheetHandle, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            </View>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          {MORE_GROUPS.map((group) => (
            <View key={group.label} style={styles.sheetGroup}>
              <Text style={[styles.sheetGroupLabel, { fontFamily: F.heading }]}>{group.label}</Text>
              <View style={styles.sheetGroupItems}>
                {group.items.map((item) => {
                  const isActive = currentScreen === item.name;
                  const isPinned = pinnedTabs.includes(item.name);
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.sheetItem]}
                      onPress={() => { onClose(); onNavigate(item.name); }}
                      onLongPress={() => { Vibration.vibrate(40); togglePin(item.name); }}
                      delayLongPress={400}
                    >
                      <Ionicons name={item.icon} size={22} color="rgba(255,255,255,0.75)" />
                      <Text style={[styles.sheetItemLabel, { fontFamily: F.body }]}>{item.label}</Text>
                      {isPinned && <Text style={[styles.sheetPinHint, { fontFamily: F.body }]}>· pinned</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Main navigator ──────────────────────────────────────────────────────────
function AppNavigator() {
  const C = useTheme();
  const { state, setState, setHomeEditMode } = useApp();
  const isDark = state?.theme === 'dark';
  const [activeScreen, setActiveScreen] = useState('Home');
  const [sheetVisible, setSheetVisible] = useState(false);

  // Splash — only shown on cold launch for returning users
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const appFadeIn = useRef(new Animated.Value(0)).current;
  const hasUserName = !!state?.userName;

  useEffect(() => {
    if (!hasUserName) {
      setSplashVisible(false);
      appFadeIn.setValue(1);
      return;
    }
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(appFadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start(() => setSplashVisible(false));
    }, 400);
    return () => clearTimeout(t);
  }, []);

  function toggleTheme() {
    setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
  }

  if (!state?.userName) {
    return (
      <>
        <StatusBar style="dark" backgroundColor={C.bg} />
        <WelcomeScreen />
      </>
    );
  }

  const ActiveScreen = SCREENS[activeScreen] || HomeScreen;

  return (
    <Animated.View style={{ flex: 1, backgroundColor: C.bg, opacity: appFadeIn }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={C.bg} />

      <GatherHeader
        C={C}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        showEditBtn={activeScreen === 'Home'}
        onEditHome={() => setHomeEditMode(true)}
      />

      {/* Active screen */}
      <View style={{ flex: 1 }}>
        <ActiveScreen navigation={{ navigate: setActiveScreen }} />
      </View>

      {/* Custom tab bar */}
      <CustomTabBar
        activeScreen={activeScreen}
        onPress={setActiveScreen}
        onMorePress={() => setSheetVisible(true)}
        C={C}
        pinnedTabs={state?.pinnedTabs || ['Journal', 'Tasks', 'Habits']}
      />

      <MoreSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onNavigate={setActiveScreen}
        C={C}
        currentScreen={activeScreen}
      />

      <ToastContainer />

      {splashVisible && (
        <Animated.View style={[styles.splash, { backgroundColor: C.bg, opacity: splashOpacity }]}>
          <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
            <Circle cx={27} cy={27} r={19} fill="#EDD9A3" />
            <Circle cx={53} cy={27} r={19} fill="#C9A84C" opacity={0.85} />
            <Circle cx={27} cy={53} r={19} fill="#C9A84C" opacity={0.7} />
            <Circle cx={53} cy={53} r={19} fill="#EDD9A3" opacity={0.6} />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppAlertProvider>
            <AppNavigator />
          </AppAlertProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLogo:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActions:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },

  // Custom tab bar
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 10,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Splash
  splash: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // More sheet
  sheet:           { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12 },
  sheetHandleArea: { paddingVertical: 20, alignItems: 'center' },
  sheetHandle:     { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetScroll:     { paddingHorizontal: 16, paddingBottom: 8, maxHeight: 500 },
  sheetGroup:      { marginBottom: 16 },
  sheetGroupLabel: { fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', paddingHorizontal: 4, marginBottom: 8 },
  sheetGroupItems: { gap: 2 },
  sheetItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 },
  sheetItemLabel:  { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  sheetPinHint:    { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});
