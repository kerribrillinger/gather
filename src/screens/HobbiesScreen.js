import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, Modal, FlatList, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp, useTheme, useFont } from '../AppContext';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

const CATEGORY_OPTIONS = ['📚 Book', '🎬 Audiobook', '📺 Show', '🎮 Game', '🎵 Music', '🎙️ Podcast', '✏️ Other'];

const STATUS_TABS = [
  { key: 'current',   label: 'Current'   },
  { key: 'backlog',   label: 'Backlog'   },
  { key: 'completed', label: 'Completed' },
];

const TYPE_TABS = [
  { key: 'all',       label: 'All', emoji: '🎯' },
  { key: '📚 Book',   label: 'Book', emoji: '📚' },
  { key: '🎬 Audiobook', label: 'Audiobook', emoji: '🎬' },
  { key: '📺 Show',   label: 'Show', emoji: '📺' },
  { key: '🎮 Game',   label: 'Game', emoji: '🎮' },
  { key: '🎵 Music',  label: 'Music', emoji: '🎵' },
  { key: '🎙️ Podcast', label: 'Podcast', emoji: '🎙️' },
  { key: '✏️ Other',  label: 'Other', emoji: '✏️' },
];

function categoryEmoji(cat) {
  if (!cat) return '🎯';
  const found = CATEGORY_OPTIONS.find((c) => c.startsWith(cat.charAt(0)) || c.includes(cat));
  return found ? found.split(' ')[0] : '🎯';
}

async function pickCoverImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.8,
  });
  if (!result.canceled) return result.assets[0].uri;
  return null;
}

export default function HobbiesScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [activeStatus, setActiveStatus] = useState('current');
  const [activeType, setActiveType] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('📚 Book');
  const [newNotes, setNewNotes] = useState('');
  const [newCoverUri, setNewCoverUri] = useState(null);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('📚 Book');
  const [editNotes, setEditNotes] = useState('');
  const [editCoverUri, setEditCoverUri] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editReview, setEditReview] = useState('');
  const [statusPickerItem, setStatusPickerItem] = useState(null);

  const items = (state.currentlyConsuming || []).filter(
    (i) => (i.status || 'current') === activeStatus && (activeType === 'all' || i.category === activeType)
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
      coverUri: newCoverUri,
      rating: newRating,
      review: newReview.trim(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, currentlyConsuming: [entry, ...(s.currentlyConsuming || [])] }));
    resetAddForm();
    setShowAdd(false);
  }

  function resetAddForm() {
    setNewTitle('');
    setNewNotes('');
    setNewCategory('📚 Book');
    setNewCoverUri(null);
    setNewRating(0);
    setNewReview('');
  }

  function openEditItem(item) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditNotes(item.notes || '');
    setEditCoverUri(item.coverUri || null);
    setEditRating(item.rating || 0);
    setEditReview(item.review || '');
  }

  function saveEditItem() {
    const title = editTitle.trim();
    if (!title || !editingItem) return;
    setState((s) => ({
      ...s,
      currentlyConsuming: (s.currentlyConsuming || []).map((i) =>
        i.id === editingItem.id
          ? { ...i, title, category: editCategory, notes: editNotes.trim(), coverUri: editCoverUri, rating: editRating, review: editReview.trim() }
          : i
      ),
    }));
    setEditingItem(null);
  }

  function setItemStatus(id, newStatus) {
    setState((s) => ({
      ...s,
      currentlyConsuming: (s.currentlyConsuming || []).map((i) =>
        i.id === id ? { ...i, status: newStatus } : i
      ),
    }));
    setStatusPickerItem(null);
  }

  function deleteItem(id) {
    const item = (state.currentlyConsuming || []).find((i) => i.id === id);
    if (!item) return;
    Alert.alert(
      'Delete hobby',
      `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setState((s) => ({
              ...s,
              currentlyConsuming: (s.currentlyConsuming || []).filter((i) => i.id !== id),
            }));
          },
        },
      ]
    );
  }

  const statusCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = (state.currentlyConsuming || []).filter((i) => (i.status || 'current') === tab.key).length;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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

        {/* Type filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeTabScroll} contentContainerStyle={styles.typeTabs}>
          {TYPE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.typeTab, activeType === tab.key && styles.typeTabActive]}
              onPress={() => setActiveType(tab.key)}
            >
              <Text style={styles.typeTabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.typeTabText, activeType === tab.key && styles.typeTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
              <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => openEditItem(item)} activeOpacity={0.7}>
                <View style={styles.itemTop}>
                  {item.coverUri ? (
                    <Image source={{ uri: item.coverUri }} style={styles.itemCover} />
                  ) : (
                    <Text style={styles.itemEmoji}>{categoryEmoji(item.category)}</Text>
                  )}
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                {item.rating > 0 && (
                  <Text style={styles.itemRating}>
                    {Array.from({ length: 5 }, (_, i) => i < item.rating ? '★' : '☆').join('')}
                  </Text>
                )}
                {!!item.review && <Text style={styles.itemReview} numberOfLines={2}>{item.review}</Text>}
                {!!item.notes && <Text style={styles.itemNotes} numberOfLines={2}>{item.notes}</Text>}
                <TouchableOpacity style={styles.statusBtn} onPress={(e) => { e.stopPropagation(); setStatusPickerItem(item); }}>
                  <Text style={styles.statusBtnText}>
                    {item.status === 'current' ? 'Current' : item.status === 'backlog' ? 'Backlog' : 'Done'} ▼
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
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
            <Text style={styles.fieldLabel}>COVER IMAGE (optional)</Text>
            <TouchableOpacity
              style={styles.coverPickerBtn}
              onPress={async () => {
                const uri = await pickCoverImage();
                if (uri) setNewCoverUri(uri);
              }}
            >
              {newCoverUri ? (
                <Image source={{ uri: newCoverUri }} style={styles.coverPickerPreview} />
              ) : (
                <View style={styles.coverPickerPlaceholder}>
                  <Text style={styles.coverPickerPlaceholderText}>Tap to add cover</Text>
                </View>
              )}
            </TouchableOpacity>
            {newCoverUri && (
              <TouchableOpacity onPress={() => setNewCoverUri(null)} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: C.textMuted }}>Remove image</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Dune, The Bear, Hollow Knight…"
              placeholderTextColor={C.textFaint}
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
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>RATING (optional)</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNewRating(newRating === star ? 0 : star)} style={{ padding: 4 }}>
                  <Text style={[styles.ratingStarText, newRating >= star && styles.ratingStarActive]}>
                    {newRating >= star ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>REVIEW / THOUGHTS (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="What did you think?"
              placeholderTextColor={C.textFaint}
              value={newReview}
              onChangeText={setNewReview}
              multiline
              textAlignVertical="top"
            />
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>NOTES (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="Any thoughts, progress, etc…"
              placeholderTextColor={C.textFaint}
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(false); resetAddForm(); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={addItem}>
              <Text style={styles.confirmBtnText}>Add item</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Item Modal */}
      <Modal visible={!!editingItem} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity onPress={() => setEditingItem(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>COVER IMAGE (optional)</Text>
            <TouchableOpacity
              style={styles.coverPickerBtn}
              onPress={async () => {
                const uri = await pickCoverImage();
                if (uri) setEditCoverUri(uri);
              }}
            >
              {editCoverUri ? (
                <Image source={{ uri: editCoverUri }} style={styles.coverPickerPreview} />
              ) : (
                <View style={styles.coverPickerPlaceholder}>
                  <Text style={styles.coverPickerPlaceholderText}>Tap to add cover</Text>
                </View>
              )}
            </TouchableOpacity>
            {editCoverUri && (
              <TouchableOpacity onPress={() => setEditCoverUri(null)} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: C.textMuted }}>Remove image</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Dune, The Bear, Hollow Knight…"
              placeholderTextColor={C.textFaint}
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, editCategory === cat && styles.catChipActive]}
                  onPress={() => setEditCategory(cat)}
                >
                  <Text style={[styles.catChipText, editCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>RATING (optional)</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setEditRating(editRating === star ? 0 : star)} style={{ padding: 4 }}>
                  <Text style={[styles.ratingStarText, editRating >= star && styles.ratingStarActive]}>
                    {editRating >= star ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>REVIEW / THOUGHTS (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="What did you think?"
              placeholderTextColor={C.textFaint}
              value={editReview}
              onChangeText={setEditReview}
              multiline
              textAlignVertical="top"
            />
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>NOTES (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="Any thoughts, progress, etc…"
              placeholderTextColor={C.textFaint}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingItem(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={saveEditItem}>
              <Text style={styles.confirmBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Status Picker Modal */}
      <Modal visible={!!statusPickerItem} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 20, width: '100%', maxWidth: 300 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 }}>Move to…</Text>
            {['current', 'backlog', 'completed'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => statusPickerItem && setItemStatus(statusPickerItem.id, status)}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}
              >
                <Text style={{ fontSize: 15, color: statusPickerItem?.status === status ? C.accent : C.text, fontWeight: statusPickerItem?.status === status ? '700' : '500' }}>
                  {status === 'current' ? '🎯 Current' : status === 'backlog' ? '📋 Backlog' : '✅ Completed'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setStatusPickerItem(null)} style={{ marginTop: 16, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: C.textMuted, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:               { flex: 1, backgroundColor: C.bg },
    scroll:             { flex: 1 },
    content:            { padding: 20 },
    pageHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    pageTitle:          { fontSize: 32, fontWeight: '700', color: C.text, fontFamily: F.heading },
    pageSubtitle:       { fontSize: 14, color: C.textMuted, marginTop: 2 },
    addHeaderBtn:       { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, marginTop: 6 },
    addHeaderBtnText:   { color: '#fff', fontWeight: '600', fontSize: 14 },
    // Tabs
    tabs:               { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 20 },
    tab:                { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4, marginRight: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive:          { borderBottomColor: C.accent },
    tabText:            { fontSize: 15, color: C.textMuted, fontWeight: '500' },
    tabTextActive:      { color: C.accent, fontWeight: '600' },
    tabBadge:           { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
    tabBadgeActive:     { backgroundColor: C.accentLight },
    tabBadgeText:       { fontSize: 11, fontWeight: '700', color: C.textMuted },
    tabBadgeTextActive: { color: C.accent },
    // Type tabs
    typeTabScroll:      { marginHorizontal: -20, marginBottom: 16, marginTop: -8 },
    typeTabs:           { paddingHorizontal: 20, gap: 8 },
    typeTab:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.xl, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
    typeTabActive:      { borderColor: C.accent, backgroundColor: C.accentLight },
    typeTabEmoji:       { fontSize: 14 },
    typeTabText:        { fontSize: 12, color: C.textMuted, fontWeight: '500' },
    typeTabTextActive:  { color: C.accent, fontWeight: '700' },
    // Empty state
    emptyState:         { alignItems: 'center', paddingVertical: 60 },
    emptyIcon:          { fontSize: 40, marginBottom: 12 },
    emptyTitle:         { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 6 },
    emptyHint:          { fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 240 },
    // Grid
    grid:               { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    itemCard:           { width: '47%', backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.card },
    itemTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    itemEmoji:          { fontSize: 28 },
    itemCover:          { width: 48, height: 64, borderRadius: RADIUS.sm, backgroundColor: C.border },
    deleteBtn:          { padding: 4 },
    deleteBtnText:      { fontSize: 18, color: C.textFaint, lineHeight: 20 },
    itemTitle:          { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 4, lineHeight: 20, fontFamily: F.body },
    itemCategory:       { fontSize: 12, color: C.textMuted, marginBottom: 6 },
    itemRating:         { fontSize: 13, color: C.accent, fontWeight: '600', marginBottom: 4 },
    itemReview:         { fontSize: 11, color: C.textMuted, lineHeight: 16, marginBottom: 4, fontStyle: 'italic' },
    itemNotes:          { fontSize: 12, color: C.textMuted, lineHeight: 18, marginBottom: 8 },
    statusBtn:          { marginTop: 'auto', paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
    statusBtnText:      { fontSize: 12, color: C.accent, fontWeight: '600' },
    // Cover picker
    coverPickerBtn:             { marginBottom: 16 },
    coverPickerPreview:         { width: 80, height: 106, borderRadius: RADIUS.md },
    coverPickerPlaceholder:     { width: 80, height: 106, borderRadius: RADIUS.md, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
    coverPickerPlaceholderText: { fontSize: 12, color: C.textMuted, textAlign: 'center', padding: 8 },
    // Modal
    modal:              { flex: 1, backgroundColor: C.bg },
    modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:         { fontSize: 20, fontWeight: '700', color: C.text },
    modalClose:         { fontSize: 18, color: C.textMuted },
    modalBody:          { flex: 1, padding: 20 },
    modalFooter:        { flexDirection: 'row', gap: 12, padding: 20 },
    fieldLabel:         { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    fieldInput:         { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
    fieldInputMulti:    { minHeight: 100, textAlignVertical: 'top' },
    categoryGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip:            { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
    catChipActive:      { borderColor: C.accent, backgroundColor: C.accentLight },
    catChipText:        { fontSize: 13, color: C.textMuted },
    catChipTextActive:  { color: C.accent, fontWeight: '600' },
    ratingRow:          { flexDirection: 'row', gap: 4, marginBottom: 16 },
    ratingStarText:     { fontSize: 28, color: C.border },
    ratingStarActive:   { color: C.accent },
    cancelBtn:          { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelBtnText:      { fontSize: 15, color: C.textMuted, fontWeight: '500' },
    confirmBtn:         { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    confirmBtnText:     { fontSize: 15, color: '#fff', fontWeight: '600' },
  });
}
