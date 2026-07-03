// Global state context — mirrors how appState works on desktop
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, AppState } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Font from 'expo-font';
import {
  DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold,
  DMSans_400Regular_Italic,
} from '@expo-google-fonts/dm-sans';
import { Lato_400Regular, Lato_400Regular_Italic, Lato_700Bold } from '@expo-google-fonts/lato';
import { Raleway_400Regular, Raleway_400Regular_Italic, Raleway_500Medium, Raleway_600SemiBold, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { Merriweather_400Regular, Merriweather_400Regular_Italic, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Nunito_400Regular, Nunito_400Regular_Italic, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { PlayfairDisplay_400Regular, PlayfairDisplay_400Regular_Italic, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { JosefinSans_400Regular, JosefinSans_400Regular_Italic, JosefinSans_500Medium, JosefinSans_600SemiBold, JosefinSans_700Bold } from '@expo-google-fonts/josefin-sans';
import { SourceSerif4_400Regular, SourceSerif4_400Regular_Italic, SourceSerif4_700Bold } from '@expo-google-fonts/source-serif-4';
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_400Regular_Italic, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { ComicNeue_400Regular, ComicNeue_400Regular_Italic, ComicNeue_700Bold } from '@expo-google-fonts/comic-neue';
import { loadData, saveData, seedData, DEFAULT_STATE } from './storage';
import { PALETTES, FONT_OPTIONS } from './theme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setStateRaw] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const stateRef = useRef(null);

  // In-memory UI state — not persisted to storage
  const [homeEditMode, setHomeEditMode] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'DMSans_400Regular':          DMSans_400Regular,
      'DMSans_500Medium':           DMSans_500Medium,
      'DMSans_600SemiBold':         DMSans_600SemiBold,
      'DMSans_700Bold':             DMSans_700Bold,
      'DMSans_400Regular_Italic':   DMSans_400Regular_Italic,
      'Lato_400Regular':                  Lato_400Regular,
      'Lato_400Regular_Italic':           Lato_400Regular_Italic,
      'Lato_700Bold':                     Lato_700Bold,
      'Raleway_400Regular':               Raleway_400Regular,
      'Raleway_400Regular_Italic':        Raleway_400Regular_Italic,
      'Raleway_500Medium':                Raleway_500Medium,
      'Raleway_600SemiBold':              Raleway_600SemiBold,
      'Raleway_700Bold':                  Raleway_700Bold,
      'Merriweather_400Regular':          Merriweather_400Regular,
      'Merriweather_400Regular_Italic':   Merriweather_400Regular_Italic,
      'Merriweather_700Bold':             Merriweather_700Bold,
      'Outfit_400Regular':                Outfit_400Regular,
      'Outfit_500Medium':                 Outfit_500Medium,
      'Outfit_600SemiBold':               Outfit_600SemiBold,
      'Outfit_700Bold':                   Outfit_700Bold,
      'Nunito_400Regular':                Nunito_400Regular,
      'Nunito_400Regular_Italic':         Nunito_400Regular_Italic,
      'Nunito_500Medium':                 Nunito_500Medium,
      'Nunito_600SemiBold':               Nunito_600SemiBold,
      'Nunito_700Bold':                   Nunito_700Bold,
      'PlayfairDisplay_400Regular':       PlayfairDisplay_400Regular,
      'PlayfairDisplay_400Regular_Italic':PlayfairDisplay_400Regular_Italic,
      'PlayfairDisplay_700Bold':          PlayfairDisplay_700Bold,
      'JosefinSans_400Regular':           JosefinSans_400Regular,
      'JosefinSans_400Regular_Italic':    JosefinSans_400Regular_Italic,
      'JosefinSans_500Medium':            JosefinSans_500Medium,
      'JosefinSans_600SemiBold':          JosefinSans_600SemiBold,
      'JosefinSans_700Bold':              JosefinSans_700Bold,
      'SourceSerif4_400Regular':                SourceSerif4_400Regular,
      'SourceSerif4_400Regular_Italic':         SourceSerif4_400Regular_Italic,
      'SourceSerif4_700Bold':                   SourceSerif4_700Bold,
      'AtkinsonHyperlegible_400Regular':        AtkinsonHyperlegible_400Regular,
      'AtkinsonHyperlegible_400Regular_Italic': AtkinsonHyperlegible_400Regular_Italic,
      'AtkinsonHyperlegible_700Bold':           AtkinsonHyperlegible_700Bold,
      'ComicNeue_400Regular':                   ComicNeue_400Regular,
      'ComicNeue_400Regular_Italic':            ComicNeue_400Regular_Italic,
      'ComicNeue_700Bold':                      ComicNeue_700Bold,
    }).catch(() => {}).finally(() => setFontsLoaded(true));
    // Safety timeout — never block on fonts for more than 5s
    const t = setTimeout(() => setFontsLoaded(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    loadData().then((data) => {
      // Migrations
      if (!data.workLists) data.workLists = [];
      if (!data.workTodos || typeof data.workTodos !== 'object') data.workTodos = {};
      if (!data.workNotes || typeof data.workNotes !== 'object') data.workNotes = {};
      data.workLists.forEach((list) => {
        if (!data.workTodos[list.id]) data.workTodos[list.id] = [];
        if (!data.workNotes[list.id]) data.workNotes[list.id] = '';
      });
      if (!data.habits)   data.habits   = [];
      if (!data.habitLog) data.habitLog = {};

      // Migrate pinnedTabs default if not present
      if (!data.pinnedTabs) {
        data.pinnedTabs = ['Journal', 'Tasks', 'Habits'];
      }

      // Ensure all array fields are always arrays (guards against bad sync data)
      const ARRAY_FIELDS = ['photos', 'habits', 'checkIns', 'workLists', 'currentlyConsuming',
        'countdowns', 'quickLinks', 'focusItems', 'hobbies', 'notesList'];
      for (const field of ARRAY_FIELDS) {
        if (!Array.isArray(data[field])) data[field] = DEFAULT_STATE[field] ?? [];
      }

      // Migrate removed palettes
      if (data.palette === 'warm') data.palette = 'default';
      if (data.palette === 'emerald') data.palette = 'accessibleEmerald';
      if (data.palette === 'sapphire') data.palette = 'accessibleSapphire';

      // Auto-purge completed todos older than 7 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      Object.keys(data.workTodos).forEach((listId) => {
        data.workTodos[listId] = (data.workTodos[listId] || []).filter((t) => {
          if (!t.completed || !t.completedAt) return true;
          return new Date(t.completedAt) >= cutoff;
        });
      });

      // Reset focus items if from a previous day
      const todayStr = new Date().toDateString();
      if (data.focusDate !== todayStr) {
        data.focusItems = [];
        data.focusDate  = todayStr;
      }

      // Auto-seed sample data if user has a name but nothing added yet
      const isEmpty = (!data.habits || data.habits.length === 0)
        && (!data.workTodos?.personal || data.workTodos.personal.length === 0)
        && (!data.countdowns || data.countdowns.length === 0);
      if (data.userName && isEmpty) {
        const seed = seedData(data.userName);
        Object.assign(data, seed);
      }

      stateRef.current = data;
      setStateRaw(data);
    }).catch(() => {
      // Keep existing state if load fails to avoid wiping user data
      setStateRaw((prev) => prev || { ...DEFAULT_STATE });
    });
  }, []);

  function setState(updater) {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      stateRef.current = next;
      saveData(next);
      return next;
    });
  }

  // Flush on background and reset Top 3 when the app resumes on a new day.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (stateRef.current) saveData(stateRef.current);
      }
      if (nextAppState === 'active') {
        const todayStr = new Date().toDateString();
        if (stateRef.current && stateRef.current.focusDate !== todayStr) {
          const next = { ...stateRef.current, focusItems: [], focusDate: todayStr };
          stateRef.current = next;
          setStateRaw(next);
          saveData(next);
        }
      }
    });
    return () => sub.remove();
  }, []);

  if (!state || !fontsLoaded) return (
    <View style={{ flex: 1, backgroundColor: '#F2F0EB', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <Circle cx={27} cy={27} r={19} fill="#EDD9A3" />
        <Circle cx={53} cy={27} r={19} fill="#C9A84C" opacity={0.85} />
        <Circle cx={27} cy={53} r={19} fill="#C9A84C" opacity={0.7} />
        <Circle cx={53} cy={53} r={19} fill="#EDD9A3" opacity={0.6} />
      </Svg>
    </View>
  );

  return (
    <AppContext.Provider value={{ state, setState, homeEditMode, setHomeEditMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export function useTheme() {
  const ctx = useContext(AppContext);
  const palette = ctx?.state?.palette || 'default';
  const isDark = ctx?.state?.theme === 'dark';
  const base = PALETTES[palette] || PALETTES.default;
  return isDark ? { ...base, ...base.dark } : base;
}

export function useFont() {
  const ctx = useContext(AppContext);
  const fontStyle = ctx?.state?.fontStyle || 'system';
  return FONT_OPTIONS[fontStyle] || FONT_OPTIONS.system;
}
