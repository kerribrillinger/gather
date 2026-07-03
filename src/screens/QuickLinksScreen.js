// QuickLinksScreen — saved links displayed as tappable pills; opens in browser
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../BottomSheet';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import { generateId } from '../storage';
import { RADIUS } from '../theme';

function normaliseUrl(raw) {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(raw) {
  try {
    const url = new URL(normaliseUrl(raw));
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

export default function QuickLinksScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const showAlert = useAlert();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null); // null = add mode, object = edit mode
  const [labelInput, setLabelInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const quickLinks = state.quickLinks || [];
  const canSave = labelInput.trim().length > 0 && urlInput.trim().length > 0;
  const isEditing = !!editingLink;

  async function handleOpen(url) {
    const normalised = normaliseUrl(url);
    const supported = await Linking.canOpenURL(normalised).catch(() => false);
    if (supported) {
      Linking.openURL(normalised).catch(() => showAlert({ title: 'Error', message: 'Could not open this link.', buttons: [{ text: 'OK' }] }));
    } else {
      showAlert({ title: 'Invalid link', message: `Cannot open: ${normalised}`, buttons: [{ text: 'OK' }] });
    }
  }

  function openAdd() {
    setEditingLink(null);
    setLabelInput('');
    setUrlInput('');
    setSheetOpen(true);
  }

  function openEdit(link) {
    setEditingLink(link);
    setLabelInput(link.label);
    setUrlInput(link.url);
    setSheetOpen(true);
  }

  function handleSave() {
    const label = labelInput.trim();
    const url = urlInput.trim();
    if (!label || !url) return;
    if (!isValidUrl(url)) {
      showAlert({ title: 'Invalid URL', message: 'Please enter a valid web address, e.g. example.com', buttons: [{ text: 'OK' }] });
      return;
    }
    const normUrl = normaliseUrl(url);
    if (isEditing) {
      setState((s) => ({
        ...s,
        quickLinks: (s.quickLinks || []).map((l) =>
          l.id === editingLink.id ? { ...l, label, url: normUrl } : l
        ),
      }));
    } else {
      setState((s) => ({ ...s, quickLinks: [...(s.quickLinks || []), { id: generateId(), label, url: normUrl }] }));
    }
    showToast(isEditing ? 'Link updated' : 'Link added');
    setSheetOpen(false);
  }

  function handleDelete(id) {
    const link = quickLinks.find((l) => l.id === id);
    showAlert({
      title: 'Delete link',
      message: `"${link?.label || 'This link'}" will be permanently deleted.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => setState((s) => ({ ...s, quickLinks: (s.quickLinks || []).filter((l) => l.id !== id) })),
        },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Quick Links</Text>
        <Text style={styles.subtitle}>Your favourite pages, one tap away</Text>

        {quickLinks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No links saved yet. Tap + to add one.</Text>
          </View>
        ) : (
          <View style={styles.pillsContainer}>
            {quickLinks.map((link) => (
              <View key={link.id} style={styles.pillWrapper}>
                <TouchableOpacity
                  style={styles.pill}
                  onPress={() => handleOpen(link.url)}
                  onLongPress={() => openEdit(link)}
                  delayLongPress={400}
                  activeOpacity={0.75}
                >
                  <Text style={styles.pillText} numberOfLines={1}>{link.label}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pillEdit} onPress={() => openEdit(link)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="pencil-outline" size={13} color={C.accent} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.pillDelete} onPress={() => handleDelete(link.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.pillDeleteText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: C.accent }]} onPress={openAdd}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add / Edit sheet */}
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} backgroundColor={C.bg}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{isEditing ? 'Edit link' : 'Add a link'}</Text>
          <TouchableOpacity style={[styles.sheetSaveBtn, !canSave && { opacity: 0.4 }]} onPress={handleSave} disabled={!canSave}>
            <Text style={styles.sheetSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sheetBody}>
          <TextInput
            style={styles.input}
            placeholder="Label (e.g. GitHub)"
            placeholderTextColor={C.textFaint}
            value={labelInput}
            onChangeText={setLabelInput}
            autoFocus
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="URL (e.g. github.com)"
            placeholderTextColor={C.textFaint}
            value={urlInput}
            onChangeText={setUrlInput}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
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
    pillsContainer:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pillWrapper:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accentLight, borderRadius: 999, borderWidth: 1, borderColor: C.accent, paddingLeft: 14, paddingRight: 6, paddingVertical: 8, maxWidth: '90%' },
    pill:            { flexShrink: 1 },
    pillText:        { fontSize: 13, fontFamily: F.body, color: C.accent },
    pillEdit:        { marginLeft: 8, paddingHorizontal: 4 },
    pillDelete:      { marginLeft: 2, paddingHorizontal: 4 },
    pillDeleteText:  { fontSize: 18, color: C.accent, lineHeight: 20 },
    fab:             { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    sheetHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
    sheetTitle:      { fontSize: 18, fontFamily: F.heading, color: C.text },
    sheetSaveBtn:    { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.md },
    sheetSaveBtnText:{ color: '#fff', fontFamily: F.heading, fontSize: 14 },
    sheetBody:       { paddingHorizontal: 20, paddingBottom: 40 },
    input:           { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 12, fontFamily: F.body },
  });
}
