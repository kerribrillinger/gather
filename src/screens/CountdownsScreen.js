// CountdownsScreen — list of labelled countdowns with days-remaining display
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet from '../BottomSheet';
import { useApp, useTheme, useFont } from '../AppContext';
import { showToast } from '../Toast';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

function daysLabel(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { text: 'Today!', overdue: false, today: true };
  if (diffDays > 0)  return { text: `${diffDays} day${diffDays === 1 ? '' : 's'} away`, overdue: false, today: false };
  return { text: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`, overdue: true, today: false };
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function CountdownsScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const countdowns = state.countdowns || [];

  function openSheet() {
    setLabelInput('');
    setPickerDate(new Date());
    setShowPicker(false);
    setSheetOpen(true);
  }

  function handleAdd() {
    const trimmed = labelInput.trim();
    if (!trimmed) return;
    setState((s) => ({ ...s, countdowns: [...(s.countdowns || []), { id: generateId(), label: trimmed, date: pickerDate.toISOString() }] }));
    showToast('Countdown added');
    setSheetOpen(false);
  }

  function handleDelete(id) {
    setState((s) => ({ ...s, countdowns: (s.countdowns || []).filter((c) => c.id !== id) }));
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Countdowns</Text>
        <Text style={styles.subtitle}>Track upcoming events</Text>

        {countdowns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No countdowns yet. Tap + to add one.</Text>
          </View>
        ) : (
          countdowns.map((item) => {
            const { text, overdue, today: isToday } = daysLabel(item.date);
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                  <Text style={[styles.cardDays, overdue && { color: '#E05252' }, isToday && { color: C.accent }]}>
                    {text}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.deleteBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: C.accent }]} onPress={openSheet}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add sheet */}
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} backgroundColor={C.bg}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Add a countdown</Text>
          <TouchableOpacity style={[styles.sheetSaveBtn, !labelInput.trim() && { opacity: 0.4 }]} onPress={handleAdd} disabled={!labelInput.trim()}>
            <Text style={styles.sheetSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sheetBody}>
          <TextInput
            style={styles.input}
            placeholder="Label (e.g. Birthday party)"
            placeholderTextColor={C.textFaint}
            value={labelInput}
            onChangeText={setLabelInput}
            autoFocus
            returnKeyType="done"
          />

          <TouchableOpacity style={styles.dateField} onPress={() => setShowPicker((v) => !v)}>
            <Text style={styles.dateFieldText}>
              {pickerDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={styles.dateFieldIcon}>📅</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(e, selected) => {
                if (Platform.OS === 'android') setShowPicker(false);
                if (selected) setPickerDate(selected);
              }}
              minimumDate={new Date()}
            />
          )}
          {Platform.OS === 'ios' && showPicker && (
            <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPicker(false)}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: C.bg },
    scroll:          { flex: 1 },
    content:         { padding: 20 },
    title:           { fontSize: 28, color: C.text, fontFamily: F.heading, marginBottom: 4 },
    subtitle:        { fontSize: 14, color: C.textMuted, marginBottom: 24, fontFamily: F.body },
    emptyState:      { paddingVertical: 60, alignItems: 'center' },
    emptyText:       { fontSize: 14, color: C.textFaint, fontFamily: F.italic || F.body },
    card:            { backgroundColor: C.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', ...SHADOW.card },
    cardBody:        { flex: 1 },
    cardLabel:       { fontSize: 16, fontFamily: F.heading, color: C.text, marginBottom: 4 },
    cardDate:        { fontSize: 12, color: C.textMuted, marginBottom: 2, fontFamily: F.body },
    cardDays:        { fontSize: 13, fontFamily: F.body, color: C.accent },
    deleteBtn:       { paddingLeft: 12, justifyContent: 'center' },
    deleteBtnText:   { fontSize: 22, color: C.textFaint, lineHeight: 24 },
    fab:             { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    sheetHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
    sheetTitle:      { fontSize: 18, fontFamily: F.heading, color: C.text },
    sheetSaveBtn:    { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.md },
    sheetSaveBtnText:{ color: '#fff', fontFamily: F.heading, fontSize: 14 },
    sheetBody:       { paddingHorizontal: 20, paddingBottom: 40 },
    input:           { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 12, fontFamily: F.body },
    dateField:       { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dateFieldText:   { fontSize: 14, color: C.text, fontFamily: F.body },
    dateFieldIcon:   { fontSize: 16 },
    pickerDone:      { alignItems: 'flex-end', paddingVertical: 8 },
    pickerDoneText:  { fontSize: 14, color: C.accent, fontFamily: F.heading },
  });
}
