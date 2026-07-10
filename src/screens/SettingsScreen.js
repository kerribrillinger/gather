import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Switch, StyleSheet, Platform, Modal, KeyboardAvoidingView, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import BottomSheet from '../BottomSheet';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import { RADIUS, SHADOW, PALETTES, FONT_OPTIONS } from '../theme';
import { saveData, DEFAULT_STATE } from '../storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';


const SETTINGS_TABS = [
  { key: 'profile',       label: 'Profile'       },
  { key: 'sections',      label: 'Sections'      },
  { key: 'modes',         label: 'Modes'         },
  { key: 'notifications', label: 'Notifications' },
  { key: 'sync',          label: 'Sync'          },
];

// All home card keys and display labels for the Sections tab
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

const HOME_CARD_DESCRIPTIONS = {
  quote:      'A rotating inspirational quote to start your day',
  top3:       'Pin your three most important tasks for the day',
  habits:     'Track your daily habits and streaks at a glance',
  tasks:      'See your open tasks across all lists',
  checkin:    'Log your mood and a daily journal entry',
  notes:      'Quick-access notes pinned to your home screen',
  countdowns: 'Count down to upcoming events and dates',
  quicklinks: 'Your saved links and bookmarks',
  enjoying:   'Track what you\'re currently reading, watching, or listening to',
  photos:     'A rotating photo from your saved collection',
};

const HOME_CARD_KEYS = Object.keys(HOME_CARD_LABELS);

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SettingsScreen() {
  const { state, setState } = useApp();
  const stateRef = useRef(state);
  stateRef.current = state;
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);
  const showAlert = useAlert();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab]           = useState('profile');
  const [paletteModalOpen, setPaletteModalOpen] = useState(false);
  const [fontModalOpen, setFontModalOpen]   = useState(false);

  const [locationBusy, setLocationBusy] = useState(false);

  // Sync tab state
  const [syncModalVisible, setSyncModalVisible]   = useState(false);
  const [syncModalMode, setSyncModalMode]         = useState('get'); // 'get' | 'send'
  const [syncUrlInput, setSyncUrlInput]           = useState(state.syncUrl || '');
  const [syncCodeInput, setSyncCodeInput]         = useState('');
  const [syncBusy, setSyncBusy]                   = useState(false);
  const [syncScanning, setSyncScanning]           = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  // Profile tab inputs — sync from state so stale value isn't shown after external name change
  const [nameInput, setNameInput]                         = useState(state.userName || '');
  const [weatherLocationInput, setWeatherLocationInput]   = useState(state.weatherLocation || '');

  // Keep profile inputs in sync with state (e.g. name changed on HomeScreen)
  React.useEffect(() => { setNameInput(state.userName || ''); }, [state.userName]);
  React.useEffect(() => { setWeatherLocationInput(state.weatherLocation || ''); }, [state.weatherLocation]);

  // Notifications tab: add-reminder inline form state
  const [showAddReminder, setShowAddReminder]   = useState(false);
  const [reminderMessage, setReminderMessage]   = useState('');
  const [reminderTime, setReminderTime]         = useState('');
  const [reminderRecurring, setReminderRecurring] = useState(false);

  // Time picker state: which picker is open + its current Date value
  const [pickerTarget, setPickerTarget]   = useState(null); // 'todos' | 'habits' | 'custom'
  const [pickerDate, setPickerDate]       = useState(new Date());

  // ─── Derived state helpers ─────────────────────────────────────────────────

  const hiddenSections = state.hiddenSections || [];

  // Weekend mode schedule
  const weekendSchedule = state.weekendModeSchedule || {
    enabled: false,
    startDay: 5,
    startTime: '17:00',
    endDay: 1,
    endTime: '09:00',
  };

  // Notification settings
  const notifSettings = state.notificationSettings || {
    habits: { enabled: false, time: '21:00' },
    todos: { enabled: false, mode: 'overdue', time: '09:00' },
    custom: [],
  };
  const customReminders = notifSettings.custom || [];

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function saveName() {
    setState((s) => ({ ...s, userName: nameInput.trim() }));
    showToast('Name saved');
  }

  function saveWeatherLocation() {
    setState((s) => ({ ...s, weatherLocation: weatherLocationInput.trim(), weatherCoords: null }));
    showToast('Location saved');
  }

  async function useDeviceLocation() {
    setLocationBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert({ title: 'Location blocked', message: 'Please enable location access for Gather in your device settings.', buttons: [{ text: 'OK' }] });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const city = place?.city || place?.subregion || place?.region || '';
      if (!city) { showToast('Could not detect city'); return; }
      setWeatherLocationInput(city);
      setState((s) => ({ ...s, weatherLocation: city, weatherCoords: null }));
      showToast(`Location set to ${city}`);
    } catch {
      showToast('Could not get location');
    } finally {
      setLocationBusy(false);
    }
  }

  function toggleSection(key) {
    setState((s) => {
      const hidden = s.hiddenSections || [];
      const isHiding = !hidden.includes(key);
      const next = isHiding ? [...hidden, key] : hidden.filter((k) => k !== key);
      showToast(isHiding ? `${HOME_CARD_LABELS[key]} hidden` : `${HOME_CARD_LABELS[key]} shown`);
      return { ...s, hiddenSections: next };
    });
  }

  function toggleWeekendMode(value) {
    setState((s) => ({ ...s, weekendMode: value }));
    showToast(value ? 'Weekend mode on' : 'Weekend mode off');
  }

  function updateWeekendSchedule(updates) {
    setState((s) => ({
      ...s,
      weekendModeSchedule: { ...(s.weekendModeSchedule || {}), ...updates },
    }));
  }

  function updateNotifHabits(updates) {
    setState((s) => ({
      ...s,
      notificationSettings: {
        ...(s.notificationSettings || {}),
        habits: { ...(s.notificationSettings?.habits || {}), ...updates },
      },
    }));
  }

  function updateNotifTodos(updates) {
    setState((s) => ({
      ...s,
      notificationSettings: {
        ...(s.notificationSettings || {}),
        todos: { ...(s.notificationSettings?.todos || {}), ...updates },
      },
    }));
  }

  function addCustomReminder() {
    const message = reminderMessage.trim();
    const time = reminderTime.trim();
    if (!message) return;
    if (!time) { showAlert({ title: 'Set a time', message: 'Please tap the time button to choose a time for this reminder.', buttons: [{ text: 'OK' }] }); return; }

    const newReminder = {
      id: `rem${Date.now()}`,
      message,
      time,
      recurring: reminderRecurring,
      enabled: true,
    };

    setState((s) => ({
      ...s,
      notificationSettings: {
        ...(s.notificationSettings || {}),
        custom: [...(s.notificationSettings?.custom || []), newReminder],
      },
    }));

    setReminderMessage('');
    setReminderTime('');
    setReminderRecurring(false);
    setShowAddReminder(false);
    setPickerTarget(null);
    showToast('Reminder added');
  }

  function deleteCustomReminder(id) {
    setState((s) => ({
      ...s,
      notificationSettings: {
        ...(s.notificationSettings || {}),
        custom: (s.notificationSettings?.custom || []).filter((r) => r.id !== id),
      },
    }));
  }

  // ─── Time picker helpers ────────────────────────────────────────────────────

  function timeStringToDate(hhmm) {
    const [h, m] = (hhmm || '09:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  function dateToTimeString(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  function openPicker(target, currentTime) {
    setPickerDate(timeStringToDate(currentTime));
    setPickerTarget(target);
  }

  function onPickerChange(event, selectedDate) {
    setPickerTarget(null);
    if (!selectedDate || event.type === 'dismissed') return;
    const timeStr = dateToTimeString(selectedDate);
    if (pickerTarget === 'todos')         updateNotifTodos({ time: timeStr });
    if (pickerTarget === 'habits')        updateNotifHabits({ time: timeStr });
    if (pickerTarget === 'custom')        setReminderTime(timeStr);
    if (pickerTarget === 'scheduleStart') updateWeekendSchedule({ startTime: timeStr });
    if (pickerTarget === 'scheduleEnd')   updateWeekendSchedule({ endTime: timeStr });
  }

  // ─── Notification scheduling ────────────────────────────────────────────────

  async function requestNotifPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async function scheduleAllNotifications(overrideSettings) {
    const settings = overrideSettings || state.notificationSettings || {};
    const hasEnabled =
      settings.todos?.enabled ||
      settings.habits?.enabled ||
      (settings.custom || []).some((r) => r.enabled);

    if (!hasEnabled) {
      showToast('No notifications are enabled');
      return;
    }

    const granted = await requestNotifPermission();
    if (!granted) {
      showAlert({ title: 'Notifications blocked', message: 'Please enable notifications for Gather in your device settings.', buttons: [{ text: 'OK' }] });
      return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();

    const androidChannel = Platform.OS === 'android' ? { channelId: 'default' } : {};

    if (settings.todos?.enabled && settings.todos?.time) {
      const [h, m] = settings.todos.time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Tasks reminder',
          body: settings.todos.mode === 'digest' ? "Here's your daily task digest." : 'You have overdue or due tasks today.',
          ...androidChannel,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
      });
    }

    if (settings.habits?.enabled && settings.habits?.time) {
      const [h, m] = settings.habits.time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Habits reminder',
          body: "Don't forget to log your habits today!",
          ...androidChannel,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
      });
    }

    for (const reminder of settings.custom || []) {
      if (!reminder.enabled || !reminder.time) continue;
      const [h, m] = reminder.time.split(':').map(Number);
      if (reminder.recurring) {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Reminder', body: reminder.message, ...androidChannel },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
        });
      } else {
        // One-time: schedule for the next occurrence of this time (today if not yet passed, else tomorrow)
        const date = new Date();
        date.setHours(h, m, 0, 0);
        if (date <= new Date()) date.setDate(date.getDate() + 1);
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Reminder', body: reminder.message, ...androidChannel },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
        });
      }
    }
    showToast('Notifications scheduled');
  }

  function resetData() {
    showAlert({
      title: 'Reset all data',
      message: 'This will permanently delete all your tasks, journals, habits, and settings. This cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () =>
            setState(() => ({
              ...DEFAULT_STATE,
              workLists: [{ id: 'personal', name: 'Personal', colorIndex: 0, isWork: false }],
            })),
        },
      ],
    });
  }

  // ─── Sync helpers ──────────────────────────────────────────────────────────

  async function openSyncModal(mode) {
    setSyncModalMode(mode);
    setSyncUrlInput('');
    setSyncCodeInput('');
    scannedRef.current = false;
    // Open QR scanner by default — ensure permission first
    let granted = cameraPermission?.granted;
    if (!granted) {
      const result = await requestCameraPermission();
      granted = result.granted;
    }
    setSyncScanning(granted);
    setSyncModalVisible(true);
  }

  function extractBaseAndToken(rawUrl) {
    const qIndex = rawUrl.indexOf('?');
    if (qIndex === -1) return { base: rawUrl.replace(/\/$/, ''), token: '' };
    const base = rawUrl.slice(0, qIndex).replace(/\/$/, '');
    const query = rawUrl.slice(qIndex + 1);
    const tokenMatch = query.match(/(?:^|&)t=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';
    return { base, token };
  }

  function xhrRequest(method, url, headers, body) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      if (headers) Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.timeout = 10000;
      xhr.ontimeout = () => reject(new Error('Connection timed out'));
      xhr.onerror = () => reject(new Error('Network request failed'));
      xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
      xhr.send(body || null);
    });
  }

  async function executeSyncGet(url) {
    const { base, token } = extractBaseAndToken(url);
    setSyncBusy(true);
    try {
      const res = await xhrRequest('GET', `${base}/gather-data`, token ? { 'X-Gather-Token': token } : {});
      if (res.status === 403) throw new Error('Token mismatch — scan the QR code again to get a fresh link.');
      if (res.status < 200 || res.status >= 300) throw new Error(`Server returned ${res.status}`);
      const data = JSON.parse(res.text);

      // Use stateRef.current (not the closure `state`) so any changes made while
      // the async fetch was in-flight are included, not overwritten.
      const prev = stateRef.current;
      const merged = {
        ...prev,
        ...data,
        syncUrl: base,
        hasOnboarded: true,
        userName: prev.userName || data.userName || '',
        notificationSettings: prev.notificationSettings,
        weekendModeSchedule: prev.weekendModeSchedule,
        pinnedTabs: prev.pinnedTabs,
        hasSeenSettingsHint: prev.hasSeenSettingsHint,
      };

      const ARRAY_FIELDS = ['photos', 'habits', 'checkIns', 'workLists', 'currentlyConsuming',
        'countdowns', 'quickLinks', 'focusItems', 'hobbies', 'notesList'];
      for (const field of ARRAY_FIELDS) {
        const incoming = data[field];
        const existing = prev[field] ?? [];
        if (!Array.isArray(incoming) || (incoming.length === 0 && existing.length > 0)) {
          merged[field] = existing;
        }
      }

      const OBJECT_FIELDS = ['workTodos', 'workNotes', 'habitLog'];
      for (const field of OBJECT_FIELDS) {
        const incoming = data[field];
        const existing = prev[field] ?? {};
        if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming) ||
            (Object.keys(incoming).length === 0 && Object.keys(existing).length > 0)) {
          merged[field] = existing;
        }
      }

      if ((!data.notes || data.notes === '') && prev.notes) merged.notes = prev.notes;

      // Save to AsyncStorage first, then commit exact merged object to React state.
      await saveData(merged);
      setState(() => merged);

      setSyncModalVisible(false);
      showAlert({ title: 'Synced', message: 'Data pulled from desktop successfully.', buttons: [{ text: 'OK' }] });
    } catch (error) {
      const isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('timed out');
      const isNetwork = error.message?.includes('Network request failed');
      if (isNetwork || isTimeout) {
        // Clear stale saved URL so next session doesn't auto-fill a dead address
        setState(s => ({ ...s, syncUrl: '' }));
      }
      const msg = `${error.name}: ${error.message}\n\nURL: ${base}/gather-data\nToken: ${token ? token.slice(0,3)+'...' : 'none'}`;
      showAlert({ title: 'Sync failed', message: msg, buttons: [{ text: 'OK' }] });
    } finally {
      setSyncBusy(false);
    }
  }

  async function executeSyncSend(url) {
    const { base, token } = extractBaseAndToken(url);
    setSyncBusy(true);
    // Read freshest state via setState callback to avoid stale closure
    let freshState = null;
    await new Promise(resolve => {
      setState(s => { freshState = s; resolve(); return s; });
    });
    try {
      const body = JSON.stringify({
        ...freshState,
        photos: (freshState.photos || []).map(p => ({ ...p, uri: null })),
        currentlyConsuming: (freshState.currentlyConsuming || []).map(i => ({ ...i, coverUri: null })),
        hobbies: (freshState.hobbies || []).map(h => ({ ...h, coverUri: null })),
      });
      const res = await xhrRequest('POST', `${base}/gather-data`, {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Gather-Token': token } : {}),
      }, body);
      if (res.status === 403) throw new Error('Token mismatch — scan the QR code again to get a fresh link.');
      if (res.status < 200 || res.status >= 300) throw new Error(`Server returned ${res.status}`);

      setState((s) => ({ ...s, syncUrl: base }));

      setSyncModalVisible(false);
      showAlert({ title: 'Synced', message: 'Data sent to desktop successfully.', buttons: [{ text: 'OK' }] });
    } catch (error) {
      const isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('timed out');
      const isNetwork = error.message?.includes('Network request failed');
      if (isNetwork || isTimeout) {
        setState(s => ({ ...s, syncUrl: '' }));
      }
      const msg = `${error.name}: ${error.message}\n\nURL: ${base}/gather-data\nToken: ${token ? token.slice(0,3)+'...' : 'none'}`;
      showAlert({ title: 'Sync failed', message: msg, buttons: [{ text: 'OK' }] });
    } finally {
      setSyncBusy(false);
    }
  }

  function handleSyncConfirm() {
    const rawBase = syncUrlInput.trim().replace(/\/$/, '');
    const { base: cleanBase, token: urlToken } = extractBaseAndToken(rawBase);
    const code = syncCodeInput.trim().toUpperCase() || urlToken;
    if (!cleanBase) {
      showAlert({ title: 'No address', message: 'Enter the server address shown in Gather desktop → Settings → Sync.', buttons: [{ text: 'OK' }] });
      return;
    }
    if (!code) {
      showAlert({ title: 'No code', message: 'Enter the 6-character code shown below the address in Gather desktop.', buttons: [{ text: 'OK' }] });
      return;
    }
    const url = `${cleanBase}?t=${code}`;
    if (syncModalMode === 'get') {
      executeSyncGet(url);
    } else {
      executeSyncSend(url);
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  function renderSyncModal() {
    const isGet = syncModalMode === 'get';

    function handleBarcodeScan({ data }) {
      if (scannedRef.current || syncBusy) return;
      const url = data.trim().replace(/\/$/, '');
      if (!url.startsWith('http')) return;
      scannedRef.current = true;
      setSyncScanning(false);
      setSyncUrlInput(url);
      // Small delay so camera closes cleanly before the network request starts
      setTimeout(() => {
        if (isGet) {
          executeSyncGet(url);
        } else {
          executeSyncSend(url);
        }
      }, 300);
    }

    return (
      <Modal
        visible={syncModalVisible}
        animationType="slide"
        onRequestClose={() => { if (!syncBusy) { setSyncModalVisible(false); setSyncScanning(false); } }}
      >
        {syncScanning ? (
          // ── QR Scanner fullscreen ──────────────────────────────────
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScan}
            />
            <View style={styles.scanOverlay} pointerEvents="none">
              <View style={styles.scanFrame} />
              <Text style={styles.scanHint}>Point at the QR code in Gather desktop</Text>
            </View>
            <TouchableOpacity
              style={[styles.scanCancel, { bottom: 48 + insets.bottom }]}
              onPress={() => { setSyncScanning(false); }}
            >
              <Text style={styles.scanCancelText}>Enter manually instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Choose method or manual entry ─────────────────────────
          <KeyboardAvoidingView
            style={styles.syncModalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.syncModalBox, { paddingBottom: 24 + insets.bottom }]}>
              <Text style={[styles.sheetTitle, { fontFamily: F.heading, marginBottom: 8 }]}>
                {isGet ? 'Get from Desktop' : 'Send to Desktop'}
              </Text>

              {/* Scan QR button + Enter Manually active label */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center', gap: 4 }}
                  onPress={async () => {
                    if (!cameraPermission?.granted) {
                      const result = await requestCameraPermission();
                      if (!result.granted) return;
                    }
                    scannedRef.current = false;
                    setSyncScanning(true);
                  }}
                >
                  <Text style={{ fontSize: 22 }}>📷</Text>
                  <Text style={{ fontFamily: F.heading, color: '#fff', fontSize: 13 }}>Scan QR Code</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'center' }}>Point your camera at the QR code in Gather desktop</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, borderWidth: 2, borderColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 22 }}>⌨️</Text>
                  <Text style={{ fontFamily: F.heading, color: C.accent, fontSize: 13 }}>Enter Manually</Text>
                  <Text style={{ color: C.textMuted, fontSize: 11, textAlign: 'center' }}>Type the address and code shown in Gather desktop</Text>
                </View>
              </View>

              {/* Manual fields */}
              <Text style={[styles.fieldLabel, { paddingHorizontal: 0, paddingBottom: 6, fontSize: 12 }]}>Server address</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 16, fontSize: 16, color: C.text, backgroundColor: C.bgCard, marginBottom: 12, fontFamily: F.body }}
                placeholder="http://192.168.x.x:47891"
                placeholderTextColor={C.textFaint}
                value={syncUrlInput}
                onChangeText={(v) => {
                  // Strip whitespace and ensure http:// prefix
                  let cleaned = v.trim();
                  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
                    cleaned = 'http://' + cleaned.replace(/^\/+/, '');
                  }
                  setSyncUrlInput(cleaned);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="next"
                selectionColor={C.accent}
                editable={!syncBusy}
              />
              <Text style={[styles.fieldLabel, { paddingHorizontal: 0, paddingBottom: 6, fontSize: 12 }]}>6-character code</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 16, fontSize: 22, fontWeight: '700', letterSpacing: 4, color: C.text, backgroundColor: C.bgCard, marginBottom: 20 }}
                placeholder="A1B2C3"
                placeholderTextColor={C.textFaint}
                value={syncCodeInput}
                onChangeText={(v) => setSyncCodeInput(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                keyboardType="default"
                returnKeyType="done"
                selectionColor={C.accent}
                onSubmitEditing={handleSyncConfirm}
                editable={!syncBusy}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity
                  style={styles.addReminderCancelBtn}
                  onPress={() => setSyncModalVisible(false)}
                  disabled={syncBusy}
                >
                  <Text style={styles.addReminderCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, syncBusy && { opacity: 0.5 }]}
                  onPress={handleSyncConfirm}
                  disabled={syncBusy}
                >
                  <Text style={styles.saveBtnText}>{syncBusy ? 'Syncing…' : isGet ? 'Get' : 'Send'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    );
  }

  function renderSyncTab() {
    return (
      <View>
        <Text style={styles.sectionDesc}>Share data with the Gather desktop app over WiFi. Open Gather on your desktop, go to Settings → Sync, and tap Start. Then come back here.</Text>
        <View style={[styles.card, { marginBottom: 20 }]}>
          <View style={[styles.toggleRow, styles.toggleRowBorder]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Get from Desktop</Text>
              <Text style={styles.toggleHint}>Pull data from your desktop to this device</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={() => openSyncModal('get')}>
              <Text style={styles.saveBtnText}>Get</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Send to Desktop</Text>
              <Text style={styles.toggleHint}>Push data from this device to your desktop</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={() => openSyncModal('send')}>
              <Text style={styles.saveBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  function renderUnderlineTabs() {
    return (
      <View style={styles.underlineTabs}>
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.underlineTab, isActive && styles.underlineTabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.underlineTabText, isActive && styles.underlineTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderProfileTab() {
    const activeFontKey = state.fontStyle || 'system';
    const activeFont    = FONT_OPTIONS[activeFontKey] || FONT_OPTIONS.system;

    return (
      <View>
        {/* Name */}
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

        {/* Weather location */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>LOCATION</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Location</Text>
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
          <TouchableOpacity
            style={[styles.useLocationBtn, locationBusy && { opacity: 0.5 }]}
            onPress={useDeviceLocation}
            disabled={locationBusy}
          >
            <Text style={styles.useLocationBtnText}>
              {locationBusy ? 'Detecting…' : '📍 Use my current location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* World Cup Alerts */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>⚽ World Cup Alerts</Text>
              <Text style={styles.toggleHint}>Show the FIFA World Cup 2026 banner on your home page</Text>
            </View>
            <Switch
              value={!!state.worldCupAlerts}
              onValueChange={(v) => { setState((s) => ({ ...s, worldCupAlerts: v })); showToast(v ? 'World Cup alerts on' : 'World Cup alerts off'); }}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
              ios_backgroundColor={C.border}
            />
          </View>
        </View>

        {/* Appearance: palette + font as tappable rows */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>APPEARANCE</Text>

        {/* Colour palette row */}
        <TouchableOpacity style={styles.card} onPress={() => setPaletteModalOpen(true)}>
          <View style={styles.cardRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {(() => {
                const p = PALETTES[state.palette] || PALETTES.default;
                return (
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={[styles.paletteDot, { backgroundColor: p.swatch }]} />
                    <View style={[styles.paletteDot, { backgroundColor: p.accent }]} />
                    <View style={[styles.paletteDot, { backgroundColor: p.accentLight }]} />
                  </View>
                );
              })()}
              <Text style={[styles.cardRowLabel, { fontFamily: F.body }]}>
                {(PALETTES[state.palette] || PALETTES.default).label}
              </Text>
            </View>
            <Text style={{ color: C.textFaint, fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Font row — tappable, opens modal */}
        <TouchableOpacity style={[styles.card, { marginTop: 8 }]} onPress={() => setFontModalOpen(true)}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.cardRowLabel, { fontFamily: F.body }]}>
                {activeFont.label}
              </Text>
              <Text
                style={{ fontSize: 13, color: C.textMuted, fontFamily: activeFont.body || undefined }}
                numberOfLines={1}
              >
                The quick brown fox
              </Text>
            </View>
            <Text style={{ color: C.textFaint, fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Palette picker — BottomSheet */}
        <BottomSheet visible={paletteModalOpen} onClose={() => setPaletteModalOpen(false)} backgroundColor={C.bg} fullHeight>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { fontFamily: F.heading }]}>Colour Palette</Text>
          </View>
          <ScrollView contentContainerStyle={styles.paletteList}>
            {(() => {
              const standard = Object.entries(PALETTES).filter(([, p]) => !p.accessible);
              const accessible = Object.entries(PALETTES).filter(([, p]) => p.accessible);
              return (
                <>
                  {standard.map(([key, palette]) => {
                    const isActive = state.palette === key;
                    return (
                      <TouchableOpacity key={key} style={[styles.paletteOption, isActive && { borderColor: C.accent, backgroundColor: C.accentLight }]}
                        onPress={() => { setState((s) => ({ ...s, palette: key })); setPaletteModalOpen(false); showToast(`${palette.label} palette applied`); }}>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <View style={[styles.paletteDotSm, { backgroundColor: palette.swatch }]} />
                          <View style={[styles.paletteDotSm, { backgroundColor: palette.accent }]} />
                          <View style={[styles.paletteDotSm, { backgroundColor: palette.accentLight }]} />
                        </View>
                        <Text style={[styles.paletteName, { color: isActive ? C.accent : C.text, fontFamily: isActive ? F.heading : F.body }]}>{palette.label}</Text>
                        {isActive && <Text style={{ color: C.accent, marginLeft: 'auto', fontSize: 16 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.accessibleDivider}>
                    <Text style={styles.accessibleLabel}>👁  ACCESSIBLE</Text>
                  </View>
                  {accessible.map(([key, palette]) => {
                    const isActive = state.palette === key;
                    return (
                      <TouchableOpacity key={key} style={[styles.paletteOption, isActive && { borderColor: C.accent, backgroundColor: C.accentLight }]}
                        onPress={() => { setState((s) => ({ ...s, palette: key })); setPaletteModalOpen(false); showToast(`${palette.label} palette applied`); }}>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <View style={[styles.paletteDotSm, { backgroundColor: palette.swatch }]} />
                          <View style={[styles.paletteDotSm, { backgroundColor: palette.accent }]} />
                          <View style={[styles.paletteDotSm, { backgroundColor: palette.accentLight }]} />
                        </View>
                        <Text style={[styles.paletteName, { color: isActive ? C.accent : C.text, fontFamily: isActive ? F.heading : F.body }]}>{palette.label}</Text>
                        {isActive && <Text style={{ color: C.accent, marginLeft: 'auto', fontSize: 16 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </>
              );
            })()}
          </ScrollView>
        </BottomSheet>

        {/* Font picker — BottomSheet */}
        <BottomSheet visible={fontModalOpen} onClose={() => setFontModalOpen(false)} backgroundColor={C.bg} fullHeight>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { fontFamily: F.heading }]}>Font Style</Text>
          </View>
          <ScrollView contentContainerStyle={styles.paletteList}>
            {(() => {
              const standard = Object.entries(FONT_OPTIONS).filter(([, f]) => !f.accessible);
              const accessible = Object.entries(FONT_OPTIONS).filter(([, f]) => f.accessible);
              return (
                <>
                  {standard.map(([key, font]) => {
                    const isActive = activeFontKey === key;
                    return (
                      <TouchableOpacity key={key} style={[styles.paletteOption, isActive && { borderColor: C.accent, backgroundColor: C.accentLight }]}
                        onPress={() => { setState((s) => ({ ...s, fontStyle: key })); setFontModalOpen(false); showToast(`${font.label} font applied`); }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontSize: 15, color: isActive ? C.accent : C.text, fontFamily: isActive ? (font.heading || undefined) : (font.body || undefined) }}>{font.label}</Text>
                          <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: font.body || undefined }}>The quick brown fox</Text>
                        </View>
                        {isActive && <Text style={{ color: C.accent, fontSize: 16 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.accessibleDivider}>
                    <Text style={styles.accessibleLabel}>👁  ACCESSIBLE</Text>
                  </View>
                  {accessible.map(([key, font]) => {
                    const isActive = activeFontKey === key;
                    return (
                      <TouchableOpacity key={key} style={[styles.paletteOption, isActive && { borderColor: C.accent, backgroundColor: C.accentLight }]}
                        onPress={() => { setState((s) => ({ ...s, fontStyle: key })); setFontModalOpen(false); showToast(`${font.label} font applied`); }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontSize: 15, color: isActive ? C.accent : C.text, fontFamily: isActive ? (font.heading || undefined) : (font.body || undefined) }}>{font.label}</Text>
                          <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: font.body || undefined }}>The quick brown fox</Text>
                        </View>
                        {isActive && <Text style={{ color: C.accent, fontSize: 16 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </>
              );
            })()}
          </ScrollView>
        </BottomSheet>

        {/* Light/dark theme — plain text buttons, no emoji */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>THEME</Text>
        <View style={styles.segmentedControl}>
          {[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.segmentBtn, state.theme === opt.value && styles.segmentBtnActive]}
              onPress={() => { setState((s) => ({ ...s, theme: opt.value })); showToast(`${opt.label} mode on`); }}
            >
              <Text style={[styles.segmentBtnText, state.theme === opt.value && styles.segmentBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bug report */}
        <View style={[styles.card, { marginTop: 28 }]}>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:gather.app0@gmail.com?subject=Gather%20Bug%20Report%20%C2%B7%20Android&body=What%20were%20you%20doing%20when%20it%20happened%3F%0A%0A%0AWhat%20did%20you%20expect%20vs%20what%20happened%3F%0A%0A')}>
            <Text style={[styles.dangerBtn, { color: C.accent }]}>🐛 Report a bug</Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>DANGER ZONE</Text>
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity onPress={resetData}>
            <Text style={styles.dangerBtn}>Reset all data…</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderSectionsTab() {
    return (
      <View>
        {/* Home cards visibility */}
        <Text style={styles.sectionLabel}>HOME CARDS</Text>
        <Text style={styles.sectionDesc}>Choose which cards appear on your home screen.</Text>
        <View style={styles.card}>
          {HOME_CARD_KEYS.map((key, i) => (
            <View
              key={key}
              style={[styles.toggleRow, i < HOME_CARD_KEYS.length - 1 && styles.toggleRowBorder]}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{HOME_CARD_LABELS[key]}</Text>
                <Text style={styles.toggleHint}>{HOME_CARD_DESCRIPTIONS[key]}</Text>
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

      </View>
    );
  }

  function renderModesTab() {
    return (
      <View>
        <Text style={styles.sectionLabel}>MODES</Text>
        <View style={styles.card}>
          {/* Weekend / OOO mode toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Weekend / OOO Mode</Text>
              <Text style={styles.toggleHint}>
                Hides lists tagged as work in My Lists — great if you use Gather for both work and home.
              </Text>
            </View>
            <Switch
              value={!!state.weekendMode}
              onValueChange={toggleWeekendMode}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
            />
          </View>

          {/* Auto-schedule sub-section (only when weekendMode is on) */}
          {!!state.weekendMode && (
            <View style={{ borderTopWidth: 1, borderTopColor: C.border }}>
              <View style={[styles.toggleRow, { paddingTop: 12 }]}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Auto-schedule</Text>
                  <Text style={styles.toggleHint}>Turn Weekend Mode on and off automatically.</Text>
                </View>
                <Switch
                  value={!!weekendSchedule.enabled}
                  onValueChange={(v) => updateWeekendSchedule({ enabled: v })}
                  trackColor={{ false: C.border, true: C.accent }}
                  thumbColor="#fff"
                />
              </View>

              {/* Turns on / off selectors (only when auto-schedule is enabled) */}
              {!!weekendSchedule.enabled && (
                <View style={styles.scheduleFields}>
                  {/* Turns on */}
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleRowLabel}>Turns on</Text>
                    <View style={styles.dayPills}>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayPill, weekendSchedule.startDay === index && styles.dayPillActive]}
                          onPress={() => updateWeekendSchedule({ startDay: index })}
                        >
                          <Text style={[styles.dayPillText, weekendSchedule.startDay === index && styles.dayPillTextActive]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('scheduleStart', weekendSchedule.startTime || '17:00')}>
                      <Text style={styles.timeBtnText}>{weekendSchedule.startTime || '17:00'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Turns off */}
                  <View style={[styles.scheduleRow, { marginTop: 10 }]}>
                    <Text style={styles.scheduleRowLabel}>Turns off</Text>
                    <View style={styles.dayPills}>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayPill, weekendSchedule.endDay === index && styles.dayPillActive]}
                          onPress={() => updateWeekendSchedule({ endDay: index })}
                        >
                          <Text style={[styles.dayPillText, weekendSchedule.endDay === index && styles.dayPillTextActive]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('scheduleEnd', weekendSchedule.endTime || '09:00')}>
                      <Text style={styles.timeBtnText}>{weekendSchedule.endTime || '09:00'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderTimePicker() {
    if (!pickerTarget) return null;
    return (
      <DateTimePicker
        value={pickerDate}
        mode="time"
        is24Hour
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onPickerChange}
      />
    );
  }

  function TimeButton({ time, onPress }) {
    return (
      <TouchableOpacity style={styles.timeBtn} onPress={onPress}>
        <Text style={styles.timeBtnText}>{time}</Text>
      </TouchableOpacity>
    );
  }

  function renderNotificationsTab() {
    const habitsEnabled  = !!notifSettings.habits?.enabled;
    const todosEnabled   = !!notifSettings.todos?.enabled;
    const todosMode      = notifSettings.todos?.mode || 'overdue';
    const canAddReminder = customReminders.length < 6;

    return (
      <View>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          {/* To-dos digest */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>To-dos</Text>
              <Text style={styles.toggleHint}>Alert when a task is overdue or due today.</Text>
            </View>
            <Switch
              value={todosEnabled}
              onValueChange={(v) => {
                const merged = { ...notifSettings, todos: { ...notifSettings.todos, enabled: v } };
                updateNotifTodos({ enabled: v });
                if (v) scheduleAllNotifications(merged);
              }}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
            />
          </View>

          {todosEnabled && (
            <View style={styles.notifSubSection}>
              <View style={styles.modePills}>
                {[
                  { value: 'overdue', label: 'Overdue only' },
                  { value: 'digest',  label: 'Daily digest' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.modePill, todosMode === option.value && styles.modePillActive]}
                    onPress={() => updateNotifTodos({ mode: option.value })}
                  >
                    <Text style={[styles.modePillText, todosMode === option.value && styles.modePillTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeRowLabel}>Time</Text>
                <TimeButton
                  time={notifSettings.todos?.time || '09:00'}
                  onPress={() => openPicker('todos', notifSettings.todos?.time || '09:00')}
                />
              </View>
              {pickerTarget === 'todos' && renderTimePicker()}
            </View>
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: C.border }} />

          {/* Habits reminder */}
          <View style={[styles.toggleRow, { paddingTop: 12 }]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Habits reminder</Text>
              <Text style={styles.toggleHint}>A nudge listing any habits you haven't ticked off.</Text>
            </View>
            <Switch
              value={habitsEnabled}
              onValueChange={(v) => {
                const merged = { ...notifSettings, habits: { ...notifSettings.habits, enabled: v } };
                updateNotifHabits({ enabled: v });
                if (v) scheduleAllNotifications(merged);
              }}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
            />
          </View>

          {habitsEnabled && (
            <View style={styles.notifSubSection}>
              <View style={styles.timeRow}>
                <Text style={styles.timeRowLabel}>Time</Text>
                <TimeButton
                  time={notifSettings.habits?.time || '21:00'}
                  onPress={() => openPicker('habits', notifSettings.habits?.time || '21:00')}
                />
              </View>
              {pickerTarget === 'habits' && renderTimePicker()}
            </View>
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: C.border }} />

          {/* Custom reminders */}
          <View style={[styles.toggleRow, { paddingTop: 12, paddingBottom: 8 }]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Custom reminders</Text>
              <Text style={styles.toggleHint}>
                Set any reminder you like — recurring or one-off. You can add up to 6.
              </Text>
            </View>
          </View>

          {customReminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderRow}>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderMessage}>{reminder.message}</Text>
                <Text style={styles.reminderMeta}>
                  {reminder.time}{reminder.recurring ? ' · Recurring' : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.reminderDeleteBtn} onPress={() => deleteCustomReminder(reminder.id)}>
                <Text style={styles.reminderDeleteText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          {showAddReminder && (
            <View style={styles.addReminderForm}>
              <TextInput
                style={styles.addReminderInput}
                placeholder="Reminder message…"
                placeholderTextColor={C.textFaint}
                value={reminderMessage}
                onChangeText={setReminderMessage}
              />
              <View style={[styles.timeRow, { marginTop: 10 }]}>
                <Text style={styles.timeRowLabel}>Time</Text>
                <TimeButton
                  time={reminderTime || 'Set time'}
                  onPress={() => openPicker('custom', reminderTime || '09:00')}
                />
              </View>
              {pickerTarget === 'custom' && renderTimePicker()}
              <View style={styles.reminderRecurringRow}>
                <Text style={styles.toggleLabel}>Recurring</Text>
                <Switch
                  value={reminderRecurring}
                  onValueChange={setReminderRecurring}
                  trackColor={{ false: C.border, true: C.accent }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.addReminderActions}>
                <TouchableOpacity
                  style={styles.addReminderCancelBtn}
                  onPress={() => {
                    setShowAddReminder(false);
                    setReminderMessage('');
                    setReminderTime('');
                    setReminderRecurring(false);
                    setPickerTarget(null);
                  }}
                >
                  <Text style={styles.addReminderCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addCustomReminder}>
                  <Text style={styles.saveBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!showAddReminder && (
            <TouchableOpacity
              style={[styles.addReminderBtn, !canAddReminder && styles.addReminderBtnDisabled]}
              onPress={() => canAddReminder && setShowAddReminder(true)}
              disabled={!canAddReminder}
            >
              <Text style={[styles.addReminderBtnText, !canAddReminder && styles.addReminderBtnTextDisabled]}>
                + Add reminder
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save & Schedule button */}
        <TouchableOpacity style={[styles.addReminderBtn, { marginTop: 12 }]} onPress={scheduleAllNotifications}>
          <Text style={styles.addReminderBtnText}>Save & schedule notifications</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {renderSyncModal()}
      <Text style={styles.pageTitle}>Settings</Text>
      {renderUnderlineTabs()}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile'       && renderProfileTab()}
        {activeTab === 'sections'      && renderSectionsTab()}
        {activeTab === 'modes'         && renderModesTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'sync'          && renderSyncTab()}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: C.bg },
    scroll:    { flex: 1 },
    content:   { padding: 20, flexGrow: 1 },
    pageTitle: { fontSize: 26, color: C.text, marginBottom: 4, paddingHorizontal: 20, paddingTop: 12, fontFamily: F.heading },

    // ─── Underline tabs (scrollable) ──────────────────────────────────
    underlineTabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
    underlineTab:          { flex: 1, alignItems: 'center', paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    underlineTabActive:    { borderBottomColor: C.accent },
    underlineTabText:      { fontSize: 11, color: C.textMuted, fontFamily: F.body },
    underlineTabTextActive:{ color: C.accent, fontFamily: F.heading },

    // ─── Shared ───────────────────────────────────────────────────────
    // ALL section labels use C.textFaint (not C.textMuted)
    sectionLabel:    { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' },
    sectionDesc:     { fontSize: 13, fontFamily: F.body, color: C.textMuted, marginBottom: 12, lineHeight: 18 },
    card:            { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.card, overflow: 'hidden', marginBottom: 4 },
    cardRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    cardRowLabel:    { fontSize: 15, color: C.text, fontFamily: F.body },

    // ─── Profile ──────────────────────────────────────────────────────
    fieldLabel:      { fontSize: 13, color: C.textMuted, fontFamily: F.body, marginBottom: 8, padding: 16, paddingBottom: 0 },
    nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 8 },
    nameInput:       { flex: 1, backgroundColor: C.bg, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    saveBtn:         { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md },
    saveBtnText:     { color: '#fff', fontFamily: F.heading, fontSize: 14 },
    useLocationBtn:  { marginTop: 10, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border },
    useLocationBtnText: { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    // ─── Segmented control (theme) — shared border, no gap ────────────
    segmentedControl:     { flexDirection: 'row', borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: 'hidden', marginBottom: 4 },
    segmentBtn:           { flex: 1, paddingVertical: 10, alignItems: 'center' },
    segmentBtnActive:     { backgroundColor: C.accentLight },
    segmentBtnText:       { fontSize: 14, color: C.textMuted, fontFamily: F.body },
    segmentBtnTextActive: { color: C.accent, fontFamily: F.heading },

    // ─── Palette / font modals ────────────────────────────────────────
    paletteDot:     { width: 20, height: 20, borderRadius: 10 },
    paletteDotSm:   { width: 16, height: 16, borderRadius: 8 },
    paletteList:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 8 },
    paletteOption:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border },
    paletteName:      { fontSize: 14, fontFamily: F.body },
    sheetHeader:      { paddingTop: 4, paddingBottom: 12 },
    sheetTitle:       { fontSize: 18, color: C.text },
    accessibleDivider:{ paddingVertical: 12, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
    accessibleLabel:  { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8 },
    modalCloseBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
    modalCloseText:   { fontSize: 14, color: C.textMuted, fontFamily: F.heading },

    // ─── Toggle rows ──────────────────────────────────────────────────
    toggleRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    toggleInfo:      { flex: 1, marginRight: 12 },
    toggleLabel:     { fontSize: 15, color: C.text, fontFamily: F.body },
    toggleHint:      { fontSize: 12, color: C.textMuted, marginTop: 2, fontFamily: F.body },

    // ─── Reorder drag list ────────────────────────────────────────────

    // ─── Weekend schedule ─────────────────────────────────────────────
    scheduleFields:    { padding: 8, paddingHorizontal: 16, paddingBottom: 14 },
    scheduleRow:       { gap: 8 },
    scheduleRowLabel:  { fontSize: 13, color: C.textMuted, fontFamily: F.body, marginBottom: 6 },
    dayPills:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    dayPill:           { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: C.accentLight },
    dayPillActive:     { backgroundColor: C.accent },
    dayPillText:       { fontSize: 12, fontFamily: F.body, color: C.accent },
    dayPillTextActive: { color: '#fff' },
    timeInput:         { backgroundColor: C.bg, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start', minWidth: 90, fontFamily: F.body },
    timeRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timeRowLabel:      { fontSize: 14, color: C.textMuted, fontFamily: F.body },
    timeBtn:           { backgroundColor: C.bg, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.accent },
    timeBtnText:       { fontSize: 15, color: C.accent, fontFamily: F.heading },

    // ─── Notifications ────────────────────────────────────────────────
    notifSubSection:          { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    modePills:                { flexDirection: 'row', gap: 8, marginBottom: 4 },
    modePill:                 { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: C.accentLight },
    modePillActive:           { backgroundColor: C.accent },
    modePillText:             { fontSize: 13, fontFamily: F.body, color: C.accent },
    modePillTextActive:       { color: '#fff' },
    reminderRow:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
    reminderInfo:             { flex: 1 },
    reminderMessage:          { fontSize: 14, color: C.text, fontFamily: F.body },
    reminderMeta:             { fontSize: 12, color: C.textMuted, marginTop: 2, fontFamily: F.body },
    reminderDeleteBtn:        { paddingHorizontal: 8, paddingVertical: 4 },
    reminderDeleteText:       { fontSize: 20, color: C.textMuted, lineHeight: 22 },
    addReminderBtn:           { margin: 16, marginTop: 8, backgroundColor: C.accent, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
    addReminderBtnDisabled:   { backgroundColor: C.border },
    addReminderBtnText:       { color: '#fff', fontFamily: F.heading, fontSize: 15 },
    addReminderBtnTextDisabled: { color: C.textMuted },
    addReminderForm:          { padding: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
    addReminderInput:         { backgroundColor: C.bg, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    reminderRecurringRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    addReminderActions:       { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
    addReminderCancelBtn:     { paddingHorizontal: 14, paddingVertical: 10 },
    addReminderCancelText:    { fontSize: 14, color: C.textMuted, fontFamily: F.body },

    // ─── Danger ───────────────────────────────────────────────────────
    dangerCard: { borderWidth: 1, borderColor: '#FAD4D4' },
    dangerBtn:  { fontSize: 15, color: C.danger, fontFamily: F.body, padding: 16 },

    // ─── Sync modal ───────────────────────────────────────────────────
    syncModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    syncModalBox: {
      backgroundColor: C.bgCard,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      padding: 24,
      paddingBottom: 36,
      width: '100%',
      ...SHADOW.card,
    },
    // QR Scanner
    scanOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    scanFrame: {
      width: 220,
      height: 220,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: '#fff',
    },
    scanHint: {
      color: '#fff',
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 32,
      fontFamily: F.body,
    },
    scanCancel: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 24,
    },
    scanCancelText: {
      color: '#fff',
      fontSize: 15,
      fontFamily: F.body,
    },
  });
}
