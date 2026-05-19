import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { generateId } from '../storage';
import { COLORS, RADIUS, SHADOW } from '../theme';

const CATEGORY_OPTIONS = ['📚 Book', '🎬 Movie', '📺 Show', '🎮 Game', '🎵 Music', '🎙️ Podcast', '✏️ Other'];

const STATUS_TABS = [
  { key: 'current',   label: 'Current'   },
  { key: 'backlog',   label: 'Backlog'   },
  { key: 'completed', label: 'Completed' },
];

function categoryEmoji(cat) {
  if (!cat) return '🎯';
  const found = CATEGORY_OPTIONS.find((c) => c.startsWith(cat.charAt(0)) || c.includes(cat));
  return found ? found.split(' ')[0] : '🎯';
}

export default function HobbiesScreen() {
  const { state, setState } = useApp();
  const [activeStatus, setActiveStatus] = useState('current');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('📚 Book');
  const [newNotes, setNewNotes] = useState('');

  const items = (state.currentlyConsuming || []).filter(
    (i) => (i.status || 'current') === activeStatus
  );

  function addItem() {
    const title = newTitle.trim();
    if (!title) return;
    const entry = {
      id: generateId(),
      title,
      category: newCategory,
      notes: newNotes.trim(),
      status: 'current',
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, currentlyConsuming: [entry, ...(s.currentlyConsuming || [])] }));
    setNewTitle('');
    setNewNotes('');
    setNewCategory('📚 Book');
    setShowAdd(false);
  }

  function cycleStatus(id) {
    const order = ['current', 'backlog', 'completed'];
    setState((s) => ({
      ...s,
      currentlyConsuming: (s.currentlyConsuming || []).map((i) => {
        if (i.id !== id) return i;
        const next = order[(order.indexOf(i.status || 'current') + 1) % order.length];
        return { ...i, status: next };
      }),
    }));
  }

  function deleteItem(id) {
    setState((s) => ({
      ...s,
      currentlyConsuming: (s.currentlyConsuming || []).filter((i) => i.id !== id),
    }));
  }

  const statusCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = (state.currentlyConsuming || []).filter((i) => (i.status || 'current') === tab.key).length;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Currently Enjoying</Text>
            <Text style={styles.pageSubtitle}>Books, shows, games & more</Text>
          </View>
          <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addHeaderBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Status tabs */}
        <View style={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeStatus === tab.key && styles.tabActive]}
              onPress={() => setActiveStatus(tab.key)}
            >
              <Text style={[styles.tabText, activeStatus === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {statusCounts[tab.key] > 0 && (
                <View style={[styles.tabBadge, activeStatus === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeStatus === tab.key && styles.tabBadgeTextActive]}>
                    {statusCounts[tab.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Items grid */}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeStatus === 'current' ? '🎯' : activeStatus === 'backlog' ? '📋' : '✅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeStatus === 'current' ? 'Nothing current' : activeStatus === 'backlog' ? 'Backlog is empty' : 'Nothing finished yet'}
            </Text>
            <Text style={styles.emptyHint}>
              {activeStatus === 'current' ? 'Tap + Add to track what you\'re enjoying' : 'Move items here to save for later'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemEmoji}>{categoryEmoji(item.category)}</Text>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                {!!item.notes && <Text style={styles.itemNotes} numberOfLines={2}>{item.notes}</Text>}
                <TouchableOpacity style={styles.statusBtn} onPress={() => cycleStatus(item.id)}>
                  <Text style={styles.statusBtnText}>
                    {item.status === 'current' ? '→ Backlog' : item.status === 'backlog' ? '→ Done' : '→ Current'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Dune, The Bear, Hollow Knight…"
              placeholderTextColor={COLORS.textFaint}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, newCategory === cat && styles.catChipActive]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catChipText, newCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>NOTES (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="Any thoughts, progress, etc…"
              placeholderTextColor={COLORS.textFaint}
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={addItem}>
              <Text style={styles.confirmBtnText}>Add item</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: COLORS.bg },
  scroll:             { flex: 1 },
  content:            { padding: 20 },
  pageHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle:          { fontSize: 32, fontWeight: '700', color: COLORS.text },
  pageSubtitle:       { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  addHeaderBtn:       { backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, marginTop: 6 },
  addHeaderBtnText:   { color: '#fff', fontWeight: '600', fontSize: 14 },
  // Tabs
  tabs:               { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 20 },
  tab:                { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4, marginRight: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:          { borderBottomColor: COLORS.accent },
  tabText:            { fontSize: 15, color: COLORS.textMuted, fontWeight: '500' },
  tabTextActive:      { color: COLORS.accent, fontWeight: '600' },
  tabBadge:           { backgroundColor: COLORS.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive:     { backgroundColor: COLORS.accentLight },
  tabBadgeText:       { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  tabBadgeTextActive: { color: COLORS.accent },
  // Empty state
  emptyState:         { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:          { fontSize: 40, marginBottom: 12 },
  emptyTitle:         { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  emptyHint:          { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', maxWidth: 240 },
  // Grid
  grid:               { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard:           { width: '47%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.card },
  itemTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemEmoji:          { fontSize: 28 },
  deleteBtn:          { padding: 4 },
  deleteBtnText:      { fontSize: 18, color: COLORS.textFaint, lineHeight: 20 },
  itemTitle:          { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4, lineHeight: 20 },
  itemCategory:       { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  itemNotes:          { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 8 },
  statusBtn:          { marginTop: 'auto', paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  statusBtnText:      { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  // Modal
  modal:              { flex: 1, backgroundColor: COLORS.bg },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:         { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalClose:         { fontSize: 18, color: COLORS.textMuted },
  modalBody:          { flex: 1, padding: 20 },
  modalFooter:        { flexDirection: 'row', gap: 12, padding: 20 },
  fieldLabel:         { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  fieldInput:         { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  fieldInputMulti:    { minHeight: 100, textAlignVertical: 'top' },
  categoryGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip:            { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
  catChipActive:      { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  catChipText:        { fontSize: 13, color: COLORS.textMuted },
  catChipTextActive:  { color: COLORS.accent, fontWeight: '600' },
  cancelBtn:          { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText:      { fontSize: 15, color: COLORS.textMuted, fontWeight: '500' },
  confirmBtn:         { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.accent, alignItems: 'center' },
  confirmBtnText:     { fontSize: 15, color: '#fff', fontWeight: '600' },
});
