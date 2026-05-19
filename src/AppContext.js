// Global state context — mirrors how appState works on desktop
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { loadData, saveData } from './storage';
import { PALETTES, FONT_OPTIONS } from './theme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setStateRaw] = useState(null);
  const stateRef = useRef(null);

  useEffect(() => {
    loadData().then((data) => {
      // Migrations (same as desktop init())
      if (!data.workLists || data.workLists.length === 0) {
        data.workLists = [{ id: 'personal', name: 'Personal', colorIndex: 0, isWork: false }];
      }
      data.workLists.forEach((list) => {
        if (!data.workTodos[list.id]) data.workTodos[list.id] = [];
        if (!data.workNotes[list.id]) data.workNotes[list.id] = '';
      });
      if (!data.habits)   data.habits   = [];
      if (!data.habitLog) data.habitLog = {};

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

      stateRef.current = data;
      setStateRaw(data);
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

  if (!state) return null;

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export function useTheme() {
  const ctx = useContext(AppContext);
  const palette = ctx?.state?.palette || 'warm';
  const isDark = ctx?.state?.theme === 'dark';
  const base = PALETTES[palette] || PALETTES.warm;
  return isDark ? { ...base, ...base.dark } : base;
}

export function useFont() {
  const ctx = useContext(AppContext);
  const fontStyle = ctx?.state?.fontStyle || 'system';
  return FONT_OPTIONS[fontStyle] || FONT_OPTIONS.system;
}
