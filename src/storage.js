// Gather Mobile — data persistence via AsyncStorage
// Data shape is identical to the desktop dashboard-data.json

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gather-mobile-data';

export const DEFAULT_STATE = {
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
  sectionOrder: ['quote', 'top3', 'work', 'checkin', 'consuming'],
  theme: 'light',
  palette: 'default',
  notes: '',
  countdowns: [],
  quickLinks: [],
  photos: [],
  homeCardOrder: ['quote', 'top3', 'habits', 'tasks', 'checkin', 'notes', 'countdowns', 'quicklinks', 'enjoying', 'photos'],
  notificationSettings: {
    habits: { enabled: false, time: '21:00' },
    todos: { enabled: false, mode: 'overdue', time: '09:00' },
    custom: [],
  },
  weekendModeSchedule: { enabled: false, onDay: 'friday', onTime: '17:00', offDay: 'monday', offTime: '08:00' },
  fontStyle: 'system',
  // Last-used desktop sync URL — pre-fills the sync modal
  syncUrl: '',
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

export function seedData(userName) {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

  return {
    workLists: [],
    workTodos: {},
    workNotes: {},
    focusItems: [
      { id: generateId(), text: 'Finish the project proposal', done: false },
      { id: generateId(), text: 'Go for a 20 min walk', done: true },
    ],
    habits: [
      { id: 'h1', name: 'Morning walk', emoji: '🚶', streak: 5 },
      { id: 'h2', name: 'Read for 20 mins', emoji: '📚', streak: 12 },
      { id: 'h3', name: 'Drink 2L water', emoji: '💧', streak: 3 },
      { id: 'h4', name: 'Meditate', emoji: '🧘', streak: 0 },
    ],
    habitLog: {
      h1: { [fmt(today)]: true },
      h2: { [fmt(today)]: true },
      h3: {},
      h4: {},
    },
    checkIns: [
      {
        id: generateId(),
        createdAt: today.toISOString(),
        mood: '😊',
        title: 'Feeling good today',
        body: 'Had a really productive morning. Finished the report and went for a walk at lunch. Feeling on top of things.',
      },
    ],
    notes: 'Pick up oat milk\nCall back about the invoice\nIdea: start a reading journal',
    countdowns: [
      { id: generateId(), label: 'Summer holiday ✈️', date: addDays(42) },
      { id: generateId(), label: 'Sarah\'s birthday 🎂', date: addDays(12) },
      { id: generateId(), label: 'Project deadline', date: addDays(5) },
    ],
    quickLinks: [
      { id: generateId(), label: 'Gmail', url: 'https://mail.google.com' },
      { id: generateId(), label: 'Calendar', url: 'https://calendar.google.com' },
      { id: generateId(), label: 'Spotify', url: 'https://spotify.com' },
    ],
    currentlyConsuming: [
      { id: generateId(), title: 'The Thursday Murder Club', creator: 'Richard Osman', category: '📚 Books', status: 'current', rating: 4, coverUri: null },
      { id: generateId(), title: 'Succession', creator: 'HBO', category: '📺 Shows', status: 'current', rating: 5, coverUri: null },
      { id: generateId(), title: 'Stardew Valley', creator: 'ConcernedApe', category: '🎮 Games', status: 'current', rating: 5, coverUri: null },
    ],
  };
}
