import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Pressable, StyleSheet, FlatList, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import BottomSheet from '../BottomSheet';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

// Type options used in filter chips and modal chips (no emoji prefix — badges render label only)
const TYPE_FILTER_CHIPS = [
  { key: 'all',        label: 'All'        },
  { key: 'Book',       label: 'Books'      },
  { key: 'Audiobook',  label: 'Audiobooks' },
  { key: 'Show',       label: 'Shows'      },
  { key: 'Game',       label: 'Games'      },
  { key: 'Other',      label: 'Other'      },
];

// Type options for the add/edit modal chips
const TYPE_MODAL_CHIPS = ['Book', 'Audiobook', 'Show', 'Game', 'Other'];

// Status options for the add/edit modal chips
const STATUS_MODAL_CHIPS = [
  { key: 'completed', label: 'Completed'         },
  { key: 'current',   label: 'Currently enjoying' },
  { key: 'backlog',   label: 'Backlog'            },
];

const COVER_COLORS = ['#5C6E63', '#C49A2A', '#8B5E52', '#4A7B9D', '#7B6D8D', '#5E7A5E', '#C46B4A', '#4A6B7B'];

function pickCoverColor(id) {
  if (!id || id.length === 0) return COVER_COLORS[0];
  return COVER_COLORS[id.charCodeAt(0) % COVER_COLORS.length];
}

async function launchImagePicker() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
    if (!result.canceled) return result.assets[0].uri;
    return null;
  } catch {
    return null;
  }
}

export default function HobbiesScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const showAlert = useAlert();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [activeType, setActiveType] = useState('all');
  const [showAdd, setShowAdd]       = useState(false);

  // Section collapsed state
  const [currentCollapsed,   setCurrentCollapsed]   = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [backlogCollapsed,   setBacklogCollapsed]   = useState(false);

  // Add form state
  const [newTitle,    setNewTitle]    = useState('');
  const [newCreator,  setNewCreator]  = useState('');
  const [newType,     setNewType]     = useState('Book');
  const [newStatus,   setNewStatus]   = useState('current');
  const [newCoverUri, setNewCoverUri] = useState(null);
  const [newRating,   setNewRating]   = useState(0);
  const [newReview,   setNewReview]   = useState('');

  // Edit form state
  const [editingItem,  setEditingItem]  = useState(null);
  const [editTitle,    setEditTitle]    = useState('');
  const [editCreator,  setEditCreator]  = useState('');
  const [editType,     setEditType]     = useState('Book');
  const [editStatus,   setEditStatus]   = useState('current');
  const [editCoverUri, setEditCoverUri] = useState(null);
  const [editRating,   setEditRating]   = useState(0);
  const [editReview,   setEditReview]   = useState('');

  // Normalise a category string to a bare key for comparison.
  // Handles legacy emoji-prefixed values like "📚 Books" → "Book",
  // and plural forms like "Books" → "Book".
  function normaliseCategory(cat) {
    if (!cat) return 'Other';
    // Strip leading emoji and whitespace
    const stripped = cat.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();
    // Map known plural/variant labels back to modal chip keys
    const MAP = { Books: 'Book', Audiobooks: 'Audiobook', Shows: 'Show', Games: 'Game', Films: 'Other', Podcasts: 'Other', Music: 'Other' };
    return MAP[stripped] || stripped || 'Other';
  }

  const items = (state.currentlyConsuming || []).filter((i) => {
    if (activeType === 'all') return true;
    return normaliseCategory(i.category) === activeType;
  });

  function addItem() {
    const title = newTitle.trim();
    if (!title) return;
    const id = generateId();
    const entry = {
      id,
      title,
      creator:  newCreator.trim(),
      category: newType,
      status:   newStatus,
      coverUri: newCoverUri,
      coverBg:  pickCoverColor(id),
      rating:   newRating,
      review:   newReview.trim(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, currentlyConsuming: [entry, ...(s.currentlyConsuming || [])] }));
    resetAddForm();
    showToast('Item added');
    setShowAdd(false);
  }

  function resetAddForm() {
    setNewTitle('');
    setNewCreator('');
    setNewType('Book');
    setNewStatus('current');
    setNewCoverUri(null);
    setNewRating(0);
    setNewReview('');
  }

  function openEditItem(item) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCreator(item.creator || '');
    setEditType(item.category || 'Other');
    setEditStatus(item.status || 'current');
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
          ? {
              ...i,
              title,
              creator:  editCreator.trim(),
              category: editType,
              status:   editStatus,
              coverUri: editCoverUri,
              rating:   editRating,
              review:   editReview.trim(),
            }
          : i
      ),
    }));
    setEditingItem(null);
    showToast('Item updated');
  }

  function deleteItem(id) {
    const item = (state.currentlyConsuming || []).find((i) => i.id === id);
    if (!item) return;
    showAlert({
      title: 'Delete item',
      message: `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setState((s) => ({
              ...s,
              currentlyConsuming: (s.currentlyConsuming || []).filter((i) => i.id !== id),
            }));
          },
        },
      ],
    });
  }

  // ─── Render modal form (shared between add and edit) ──────────────────────

  function renderModalForm({
    title, onClose, onSave, saveLabel,
    titleValue, onTitleChange,
    creatorValue, onCreatorChange,
    typeValue, onTypeChange,
    statusValue, onStatusChange,
    coverUri, onPickCover, onRemoveCover,
    rating, onRating,
    review, onReviewChange,
  }) {
    return (
      <BottomSheet visible onClose={onClose} backgroundColor={C.bgCard} fullHeight>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {/* Cover image — dashed upload box */}
          <Text style={styles.fieldLabel}>COVER IMAGE (optional)</Text>
          <TouchableOpacity
            style={styles.coverPickerBox}
            onPress={async () => {
              const uri = await launchImagePicker();
              if (uri) onPickCover(uri);
            }}
          >
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverPickerPreview} />
            ) : (
              <Text style={styles.coverPickerPlaceholderText}>Tap to add cover</Text>
            )}
          </TouchableOpacity>
          {coverUri && (
            <TouchableOpacity onPress={onRemoveCover} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: C.textMuted }}>Remove image</Text>
            </TouchableOpacity>
          )}

          {/* Title */}
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Dune, The Bear, Hollow Knight…"
            placeholderTextColor={C.textFaint}
            value={titleValue}
            onChangeText={onTitleChange}
            autoFocus
            returnKeyType="next"
          />

          {/* Author / creator */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>AUTHOR / CREATOR (optional)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. author, director, studio…"
            placeholderTextColor={C.textFaint}
            value={creatorValue}
            onChangeText={onCreatorChange}
            returnKeyType="done"
          />

          {/* Type chips */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>TYPE</Text>
          <View style={styles.chipRow}>
            {TYPE_MODAL_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, typeValue === chip && styles.chipActive]}
                onPress={() => onTypeChange(chip)}
              >
                <Text style={[styles.chipText, typeValue === chip && styles.chipTextActive]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Status chips */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>STATUS</Text>
          <View style={styles.chipRow}>
            {STATUS_MODAL_CHIPS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.chip, statusValue === s.key && styles.chipActive]}
                onPress={() => onStatusChange(s.key)}
              >
                <Text style={[styles.chipText, statusValue === s.key && styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>RATING (optional)</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => onRating(rating === star ? 0 : star)}
                style={{ padding: 4 }}
              >
                <Text style={[styles.ratingStar, rating >= star && styles.ratingStarActive]}>
                  {rating >= star ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Review / notes */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>REVIEW / NOTES (optional)</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputMulti]}
            placeholder="Any thoughts, progress, reviews…"
            placeholderTextColor={C.textFaint}
            value={review}
            onChangeText={onReviewChange}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={onSave}>
            <Text style={styles.confirmBtnText}>{saveLabel}</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Hobbies</Text>
          <Text style={styles.pageSubtitle}>What you're into right now</Text>
        </View>

        {/* Single-row type filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterChips}
        >
          {TYPE_FILTER_CHIPS.map((chip) => {
            const isActive = activeType === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setActiveType(chip.key)}
              >
                <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Items list — grouped by status */}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyHint}>Tap + to track what you're enjoying</Text>
          </View>
        ) : (
          <View>
            {[
              { key: 'current',   label: 'Currently Enjoying', collapsed: currentCollapsed,   setCollapsed: setCurrentCollapsed },
              { key: 'completed', label: 'Completed',          collapsed: completedCollapsed, setCollapsed: setCompletedCollapsed },
              { key: 'backlog',   label: 'Backlog',            collapsed: backlogCollapsed,   setCollapsed: setBacklogCollapsed },
            ].map(({ key, label, collapsed, setCollapsed }) => {
              const sectionItems = items.filter((i) => (i.status || 'current') === key);
              if (sectionItems.length === 0) return null;
              return (
                <View key={key} style={styles.section}>
                  <TouchableOpacity style={styles.sectionHeader} onPress={() => setCollapsed((v) => !v)}>
                    <Text style={styles.sectionHeaderText}>{label.toUpperCase()}</Text>
                    <Text style={styles.sectionChevron}>{collapsed ? '▶' : '▼'}</Text>
                  </TouchableOpacity>
                  {!collapsed && (
                    <View style={styles.grid}>
                      {sectionItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => openEditItem(item)}
                activeOpacity={0.75}
              >
                {/* Full-width cover image or coloured placeholder */}
                <View style={styles.coverWrapper}>
                  {item.coverUri ? (
                    <Image source={{ uri: item.coverUri }} style={styles.coverImage} />
                  ) : (
                    <View style={[styles.coverPlaceholder, { backgroundColor: item.coverBg || pickCoverColor(item.id) }]}>
                      <Text style={styles.coverPlaceholderText}>{item.title.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>

                {/* Card body */}
                <View style={styles.cardBody}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  {!!item.creator && (
                    <Text style={styles.itemCreator} numberOfLines={1}>{item.creator}</Text>
                  )}
                  {/* Type badge */}
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.category || 'Other'}</Text>
                  </View>
                  {/* Star rating */}
                  {item.rating > 0 && (
                    <View style={styles.starRow}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Text key={i} style={[styles.starIcon, i < item.rating && styles.starIconFilled]}>
                          {i < item.rating ? '★' : '☆'}
                        </Text>
                      ))}
                    </View>
                  )}
                  {/* Remove button below rating row */}
                  <TouchableOpacity
                    onPress={() => deleteItem(item.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add modal */}
      {showAdd && renderModalForm({
        title: 'Add Item',
        saveLabel: 'Add item',
        onClose: () => { setShowAdd(false); resetAddForm(); },
        onSave: addItem,
        titleValue:    newTitle,    onTitleChange:   setNewTitle,
        creatorValue:  newCreator,  onCreatorChange: setNewCreator,
        typeValue:     newType,     onTypeChange:    setNewType,
        statusValue:   newStatus,   onStatusChange:  setNewStatus,
        coverUri:      newCoverUri, onPickCover:     setNewCoverUri, onRemoveCover: () => setNewCoverUri(null),
        rating:        newRating,   onRating:        setNewRating,
        review:        newReview,   onReviewChange:  setNewReview,
      })}

      {/* Edit modal */}
      {!!editingItem && renderModalForm({
        title: 'Edit Item',
        saveLabel: 'Save',
        onClose: () => setEditingItem(null),
        onSave: saveEditItem,
        titleValue:    editTitle,    onTitleChange:   setEditTitle,
        creatorValue:  editCreator,  onCreatorChange: setEditCreator,
        typeValue:     editType,     onTypeChange:    setEditType,
        statusValue:   editStatus,   onStatusChange:  setEditStatus,
        coverUri:      editCoverUri, onPickCover:     setEditCoverUri, onRemoveCover: () => setEditCoverUri(null),
        rating:        editRating,   onRating:        setEditRating,
        review:        editReview,   onReviewChange:  setEditReview,
      })}
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: C.bg },
    scroll:          { flex: 1 },
    content:         { padding: 20 },

    // Page header
    pageHeader:      { marginBottom: 20 },
    pageTitle:       { fontSize: 26, color: C.text, fontFamily: F.heading },
    pageSubtitle:    { fontSize: 14, color: C.textMuted, marginTop: 2, fontFamily: F.body },
    addHeaderBtn:    { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, marginTop: 6 },
    addHeaderBtnText:{ color: '#fff', fontFamily: F.heading, fontSize: 14 },

    // Filter chips row
    filterScroll:          { marginHorizontal: -20, marginBottom: 20 },
    filterChips:           { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
    filterChip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.xl, borderWidth: 1 },
    filterChipActive:      { backgroundColor: C.accent, borderColor: C.accent },
    filterChipInactive:    { backgroundColor: C.bgCard, borderColor: C.border },
    filterChipText:        { fontSize: 13, fontFamily: F.body },
    filterChipTextActive:  { color: '#fff' },
    filterChipTextInactive:{ color: C.text },

    // Empty state
    emptyState:      { alignItems: 'center', paddingVertical: 60 },
    emptyIcon:       { fontSize: 40, marginBottom: 12 },
    emptyTitle:      { fontSize: 16, fontFamily: F.heading, color: C.text, marginBottom: 6 },
    emptyHint:       { fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 240, fontFamily: F.body },

    // Status sections
    section:         { marginBottom: 20 },
    sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionHeaderText: { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8 },
    sectionChevron:  { fontSize: 11, color: C.textFaint, fontFamily: F.body },

    // FAB
    fab:             { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    fabText:         { fontSize: 28, color: '#fff', lineHeight: 36 },

    // Grid — two-column
    grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    itemCard:        { width: '47%', backgroundColor: C.bgCard, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.card },

    // Cover — full card width × 130px tall
    coverWrapper:    { position: 'relative', width: '100%', height: 130 },
    coverImage:      { width: '100%', height: 130 },
    coverPlaceholder:{ width: '100%', height: 130, alignItems: 'center', justifyContent: 'center' },
    coverPlaceholderText: { fontSize: 36, fontFamily: F.heading, color: 'rgba(255,255,255,0.7)' },

    // Remove button — text below card body
    removeBtn:       { marginTop: 6 },
    removeBtnText:   { fontSize: 12, color: C.danger, fontFamily: F.body },

    // Card body
    cardBody:        { padding: 10 },
    itemTitle:       { fontSize: 13, color: C.text, marginBottom: 3, lineHeight: 20, fontFamily: F.heading },
    itemCreator:     { fontSize: 11, color: C.textMuted, marginBottom: 6, fontFamily: F.body },
    typeBadge:       { alignSelf: 'flex-start', backgroundColor: C.accentLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
    typeBadgeText:   { fontSize: 11, fontFamily: F.heading, color: C.accent },
    starRow:         { flexDirection: 'row', gap: 2 },
    starIcon:        { fontSize: 11, color: C.border },
    starIconFilled:  { color: C.accent },

    // Modal
    modal:           { flex: 1, backgroundColor: C.bg },
    modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:      { fontSize: 20, color: C.text, fontFamily: F.heading },
    modalClose:      { fontSize: 18, color: C.textMuted, fontFamily: F.body },
    modalBody:       { flex: 1, padding: 20 },
    modalFooter:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, padding: 16, backgroundColor: C.bgCard, borderTopWidth: 1, borderTopColor: C.border },

    // Form fields
    fieldLabel:      { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
    fieldInput:      { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    fieldInputMulti: { minHeight: 100, textAlignVertical: 'top' },

    // Cover picker — dashed upload box style
    coverPickerBox:  { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, borderRadius: RADIUS.md, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
    coverPickerPreview: { width: '100%', height: 80 },
    coverPickerPlaceholderText: { fontSize: 13, color: C.textMuted, fontFamily: F.body },

    // Modal chips
    chipRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:            { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
    chipActive:      { borderColor: C.accent, backgroundColor: C.accentLight },
    chipText:        { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    chipTextActive:  { color: C.accent, fontFamily: F.heading },

    // Rating stars in modal
    ratingRow:       { flexDirection: 'row', gap: 4, marginBottom: 16 },
    ratingStar:      { fontSize: 24, color: C.border },
    ratingStarActive:{ color: C.accent },

    // Footer buttons
    cancelBtn:       { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelBtnText:   { fontSize: 15, color: C.textMuted, fontFamily: F.body },
    confirmBtn:      { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    confirmBtnText:  { fontSize: 15, color: '#fff', fontFamily: F.heading },
  });
}
