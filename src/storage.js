// Gather Mobile — data persistence via AsyncStorage
// Data shape is identical to the desktop dashboard-data.json

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gather-mobile-data';

const DEFAULT_STATE = {
  userName: '',
  weatherLocation: '',
  currentlyConsuming: [],
  checkIns: [],
  workTodos: {},
  workNotes: {},
  workLists: [],
  homeTodoOrder: [],
  focusItems: [],
  focusDate: '',
  habits: [],
  habitLog: {},
  checkinSortOrder: 'newest',
  weekendMode: false,
  hiddenSections: [],
  theme: 'light',
  palette: 'warm',
};

export async function loadData() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const saved = JSON.parse(raw);
    // Merge with defaults so new fields are always present
    return { ...DEFAULT_STATE, ...saved };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveData(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Gather: failed to save data', e);
  }
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
