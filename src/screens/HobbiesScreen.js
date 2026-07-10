import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Image, KeyboardAvoidingView, Platform,
  Share, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import BottomSheet from '../BottomSheet';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDIA_TYPES = [
  { key: 'all',        label: 'All'        },
  { key: 'Book',       label: 'Books'      },
  { key: 'Audiobook',  label: 'Audiobooks' },
  { key: 'Show',       label: 'Shows'      },
  { key: 'Movie',      label: 'Movies'     },
  { key: 'Game',       label: 'Games'      },
  { key: 'Podcast',    label: 'Podcasts'   },
  { key: 'Music',      label: 'Music'      },
  { key: 'Other',      label: 'Other'      },
];

const MEDIA_TYPE_EMOJIS = {
  Book: '📚', Audiobook: '🎧', Show: '📺', Movie: '🎬',
  Game: '🎮', Podcast: '🎙️', Music: '🎵', Other: '✨',
};

// Genre suggestions per type — user can also type their own
const GENRE_SUGGESTIONS = {
  Book:      ['Fiction', 'Non-fiction', 'Fantasy', 'Sci-fi', 'Mystery', 'Romance', 'Thriller', 'Horror', 'Biography', 'Self-help', 'History'],
  Audiobook: ['Fiction', 'Non-fiction', 'Fantasy', 'Sci-fi', 'Mystery', 'Biography', 'Self-help'],
  Show:      ['Drama', 'Comedy', 'Thriller', 'Reality', 'Documentary', 'Anime', 'Sci-fi', 'Crime', 'Fantasy'],
  Movie:     ['Drama', 'Comedy', 'Action', 'Thriller', 'Horror', 'Romance', 'Sci-fi', 'Documentary', 'Animation'],
  Game:      ['RPG', 'Action', 'Puzzle', 'Simulation', 'Strategy', 'Horror', 'Adventure', 'Sports', 'Indie'],
  Podcast:   ['True Crime', 'Comedy', 'News', 'Tech', 'Science', 'History', 'Self-help', 'Society'],
  Music:     ['Pop', 'Rock', 'Hip-hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Country', 'Folk', 'Indie'],
  Other:     [],
};

const STATUS_SECTIONS = [
  { key: 'current',   label: 'Currently Enjoying' },
  { key: 'completed', label: 'Completed'           },
  { key: 'backlog',   label: 'Want to Enjoy'       },
];

const COVER_COLORS = ['#5C6E63', '#C49A2A', '#8B5E52', '#4A7B9D', '#7B6D8D', '#5E7A5E', '#C46B4A', '#4A6B7B'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickCoverColor(id) {
  if (!id) return COVER_COLORS[0];
  return COVER_COLORS[id.charCodeAt(0) % COVER_COLORS.length];
}

function normaliseType(cat) {
  if (!cat) return 'Other';
  const stripped = cat.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();
  const MAP = {
    Books: 'Book', Audiobooks: 'Audiobook', Shows: 'Show', Films: 'Movie',
    Movies: 'Movie', Games: 'Game', Podcasts: 'Podcast', Music: 'Music',
  };
  return MAP[stripped] || stripped || 'Other';
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

// ─── Share card component (rendered off-screen, captured as image) ────────────

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, onPress, onLongPress, C, F, styles }) {
  const typeKey = normaliseType(item.category);
  const emoji   = MEDIA_TYPE_EMOJIS[typeKey] || '✨';
  const bgColor = item.coverBg || pickCoverColor(item.id);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.75 }]}
    >
      {/* Cover */}
      <View style={styles.rowCover}>
        {item.coverUri ? (
          <Image source={{ uri: item.coverUri }} style={styles.rowCoverImage} resizeMode="cover" />
        ) : (
          <View style={[styles.rowCoverPlaceholder, { backgroundColor: bgColor }]}>
            <Text style={styles.rowCoverEmoji}>{emoji}</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.rowDetails}>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        {!!item.creator && (
          <Text style={styles.rowCreator} numberOfLines={1}>{item.creator}</Text>
        )}

        {/* Type + genre tags */}
        <View style={styles.rowTags}>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{emoji} {item.category || 'Other'}</Text>
          </View>
          {(item.genres || []).slice(0, 2).map((g) => (
            <View key={g} style={styles.genreTag}>
              <Text style={styles.genreTagText}>{g}</Text>
            </View>
          ))}
        </View>

        {/* Stars */}
        {item.rating > 0 && (
          <View style={styles.rowStars}>
            {Array.from({ length: 5 }, (_, i) => (
              <Text key={i} style={[styles.rowStar, i < item.rating && styles.rowStarFilled]}>
                {i < item.rating ? '★' : '☆'}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Chevron */}
      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HobbiesScreen() {
  const { state, setState } = useApp();
  const C       = useTheme();
  const F       = useFont();
  const styles  = useMemo(() => makeStyles(C, F), [C, F]);
  const showAlert = useAlert();

  const [activeType, setActiveType] = useState('all');
  const [showAdd,    setShowAdd]    = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionItem,  setActionItem]  = useState(null); // quick action sheet target

  // Section collapsed state
  const [collapsed, setCollapsed] = useState({});
  function toggleCollapse(key) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ─── Add form ───────────────────────────────────────────────────────────────
  const [newTitle,    setNewTitle]    = useState('');
  const [newCreator,  setNewCreator]  = useState('');
  const [newType,     setNewType]     = useState('Book');
  const [newStatus,   setNewStatus]   = useState('current');
  const [newCoverUri, setNewCoverUri] = useState(null);
  const [newRating,   setNewRating]   = useState(0);
  const [newReview,   setNewReview]   = useState('');
  const [newGenres,   setNewGenres]   = useState([]);
  const [newGenreInput, setNewGenreInput] = useState('');

  // ─── Edit form ──────────────────────────────────────────────────────────────
  const [editTitle,    setEditTitle]    = useState('');
  const [editCreator,  setEditCreator]  = useState('');
  const [editType,     setEditType]     = useState('Book');
  const [editStatus,   setEditStatus]   = useState('current');
  const [editCoverUri, setEditCoverUri] = useState(null);
  const [editRating,   setEditRating]   = useState(0);
  const [editReview,   setEditReview]   = useState('');
  const [editGenres,   setEditGenres]   = useState([]);
  const [editGenreInput, setEditGenreInput] = useState('');

  // ─── Filtered items ─────────────────────────────────────────────────────────

  const items = useMemo(() => {
    return (state.currentlyConsuming || []).filter((i) => {
      if (activeType === 'all') return true;
      return normaliseType(i.category) === activeType;
    });
  }, [state.currentlyConsuming, activeType]);

  // ─── Counts per status ──────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const all = state.currentlyConsuming || [];
    return {
      current:   all.filter((i) => (i.status || 'current') === 'current').length,
      completed: all.filter((i) => i.status === 'completed').length,
      backlog:   all.filter((i) => i.status === 'backlog').length,
    };
  }, [state.currentlyConsuming]);

  // ─── Genre helpers ──────────────────────────────────────────────────────────

  function addGenre(genre, list, setList, inputSetter) {
    const trimmed = genre.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList([...list, trimmed]);
    inputSetter('');
  }

  function removeGenre(genre, list, setList) {
    setList(list.filter((g) => g !== genre));
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  function addItem() {
    const title = newTitle.trim();
    if (!title) return;
    const id = generateId();
    const entry = {
      id, title,
      creator:  newCreator.trim(),
      category: newType,
      status:   newStatus,
      coverUri: newCoverUri,
      coverBg:  pickCoverColor(id),
      rating:   newRating,
      review:   newReview.trim(),
      genres:   newGenres,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, currentlyConsuming: [entry, ...(s.currentlyConsuming || [])] }));
    resetAddForm();
    setShowAdd(false);
    showToast('Added');
  }

  function resetAddForm() {
    setNewTitle(''); setNewCreator(''); setNewType('Book'); setNewStatus('current');
    setNewCoverUri(null); setNewRating(0); setNewReview('');
    setNewGenres([]); setNewGenreInput('');
  }

  function openEditItem(item) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCreator(item.creator || '');
    setEditType(normaliseType(item.category));
    setEditStatus(item.status || 'current');
    setEditCoverUri(item.coverUri || null);
    setEditRating(item.rating || 0);
    setEditReview(item.review || '');
    setEditGenres(item.genres || []);
    setEditGenreInput('');
  }

  function saveEditItem() {
    const title = editTitle.trim();
    if (!title || !editingItem) return;
    setState((s) => ({
      ...s,
      currentlyConsuming: (s.currentlyConsuming || []).map((i) =>
        i.id === editingItem.id
          ? { ...i, title, creator: editCreator.trim(), category: editType,
              status: editStatus, coverUri: editCoverUri, rating: editRating,
              review: editReview.trim(), genres: editGenres }
          : i
      ),
    }));
    setEditingItem(null);
    showToast('Saved');
  }

  function deleteItem(id) {
    const item = (state.currentlyConsuming || []).find((i) => i.id === id);
    if (!item) return;
    showAlert({
      title: 'Remove item',
      message: `Remove "${item.title}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          setState((s) => ({ ...s, currentlyConsuming: (s.currentlyConsuming || []).filter((i) => i.id !== id) }));
          showToast('Removed');
        }},
      ],
    });
  }

  function moveStatus(id, newStatusValue) {
    setState((s) => ({
      ...s,
      currentlyConsuming: (s.currentlyConsuming || []).map((i) =>
        i.id === id ? { ...i, status: newStatusValue } : i
      ),
    }));
    setActionItem(null);
    showToast(newStatusValue === 'completed' ? 'Marked completed' : newStatusValue === 'backlog' ? 'Moved to backlog' : 'Moved to current');
  }

  // ─── Share ───────────────────────────────────────────────────────────────────

  async function handleShare(item) {
    const verb = item.status === 'completed' ? 'just finished' : 'currently enjoying';
    const stars = item.rating ? ' ' + '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : '';
    const genres = item.genres?.length ? ` · ${item.genres.slice(0, 2).join(', ')}` : '';
    const msg = `I'm ${verb}: ${item.title}${item.creator ? ` by ${item.creator}` : ''}${genres}${stars}\n\n— shared from Gather`;
    try {
      await Share.share({ message: msg });
    } catch {
      // user cancelled — no-op
    }
    setActionItem(null);
  }

  // ─── Genre editor (shared between add and edit forms) ────────────────────────

  function renderGenreEditor({ typeValue, genres, setGenres, genreInput, setGenreInput }) {
    const suggestions = (GENRE_SUGGESTIONS[typeValue] || []).filter((g) => !genres.includes(g));
    return (
      <View>
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>GENRES (optional)</Text>

        {/* Selected genres */}
        {genres.length > 0 && (
          <View style={styles.chipRow}>
            {genres.map((g) => (
              <TouchableOpacity key={g} style={styles.genreChipSelected} onPress={() => removeGenre(g, genres, setGenres)}>
                <Text style={styles.genreChipSelectedText}>{g} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Free-type input */}
        <View style={styles.genreInputRow}>
          <TextInput
            style={[styles.fieldInput, { flex: 1 }]}
            placeholder="Type a genre…"
            placeholderTextColor={C.textFaint}
            value={genreInput}
            onChangeText={setGenreInput}
            onSubmitEditing={() => addGenre(genreInput, genres, setGenres, setGenreInput)}
            returnKeyType="done"
          />
          {genreInput.trim().length > 0 && (
            <TouchableOpacity
              style={styles.genreAddBtn}
              onPress={() => addGenre(genreInput, genres, setGenres, setGenreInput)}
            >
              <Text style={styles.genreAddBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
              {suggestions.map((g) => (
                <TouchableOpacity key={g} style={styles.genreChipSuggestion} onPress={() => addGenre(g, genres, setGenres, setGenreInput)}>
                  <Text style={styles.genreChipSuggestionText}>+ {g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  // ─── Modal form (shared add/edit) ─────────────────────────────────────────

  function renderModalForm({
    title, onClose, onSave, saveLabel,
    titleValue, onTitleChange,
    creatorValue, onCreatorChange,
    typeValue, onTypeChange,
    statusValue, onStatusChange,
    coverUri, onPickCover, onRemoveCover,
    rating, onRating,
    review, onReviewChange,
    genres, setGenres, genreInput, setGenreInput,
  }) {
    const typeOptions = MEDIA_TYPES.filter((t) => t.key !== 'all');
    const statusOptions = [
      { key: 'current',   label: 'Currently enjoying' },
      { key: 'completed', label: 'Completed'           },
      { key: 'backlog',   label: 'Want to enjoy'       },
    ];

    return (
      <BottomSheet visible onClose={onClose} backgroundColor={C.bgCard} fullHeight>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

            {/* Cover */}
            <Text style={styles.fieldLabel}>COVER IMAGE (optional)</Text>
            <TouchableOpacity
              style={styles.coverPickerBox}
              onPress={async () => { const uri = await launchImagePicker(); if (uri) onPickCover(uri); }}
            >
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverPickerPreview} />
              ) : (
                <Text style={styles.coverPickerPlaceholderText}>Tap to add cover</Text>
              )}
            </TouchableOpacity>
            {coverUri && (
              <TouchableOpacity onPress={onRemoveCover} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: F.body }}>Remove image</Text>
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

            {/* Creator */}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chipRow, { paddingRight: 16 }]}>
                {typeOptions.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.chip, typeValue === t.key && styles.chipActive]}
                    onPress={() => onTypeChange(t.key)}
                  >
                    <Text style={[styles.chipText, typeValue === t.key && styles.chipTextActive]}>
                      {MEDIA_TYPE_EMOJIS[t.key]} {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Genre editor */}
            {renderGenreEditor({ typeValue, genres, setGenres, genreInput, setGenreInput })}

            {/* Status chips */}
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>STATUS</Text>
            <View style={styles.chipRow}>
              {statusOptions.map((s) => (
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
                <TouchableOpacity key={star} onPress={() => onRating(rating === star ? 0 : star)} style={{ padding: 4 }}>
                  <Text style={[styles.ratingStar, rating >= star && styles.ratingStarActive]}>
                    {rating >= star ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Review */}
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

  // ─── Quick action sheet ───────────────────────────────────────────────────

  function renderActionSheet() {
    if (!actionItem) return null;
    const item = actionItem;
    const otherStatuses = STATUS_SECTIONS.filter((s) => s.key !== (item.status || 'current'));

    return (
      <BottomSheet visible onClose={() => setActionItem(null)} backgroundColor={C.bgCard}>
        <View style={styles.actionSheetHeader}>
          <Text style={styles.actionSheetTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.actionSheetSubtitle}>{MEDIA_TYPE_EMOJIS[normaliseType(item.category)]} {item.category}</Text>
        </View>

        {/* Move to status */}
        {otherStatuses.map((s) => (
          <TouchableOpacity key={s.key} style={styles.actionRow} onPress={() => moveStatus(item.id, s.key)}>
            <Text style={styles.actionRowText}>
              {s.key === 'completed' ? '✅' : s.key === 'backlog' ? '🔖' : '▶️'}  Move to {s.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Edit */}
        <TouchableOpacity style={styles.actionRow} onPress={() => { setActionItem(null); openEditItem(item); }}>
          <Text style={styles.actionRowText}>✏️  Edit details</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionRow} onPress={() => handleShare(item)}>
          <Text style={styles.actionRowText}>📤  Share card</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity style={[styles.actionRow, { marginBottom: 8 }]} onPress={() => { setActionItem(null); deleteItem(item.id); }}>
          <Text style={[styles.actionRowText, { color: C.danger }]}>🗑️  Remove</Text>
        </TouchableOpacity>
      </BottomSheet>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const totalCount = (state.currentlyConsuming || []).length;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Currently Enjoying</Text>
            <Text style={styles.pageSubtitle}>
              {totalCount === 0 ? 'Track what you\'re into' : `${counts.current} active · ${counts.completed} completed · ${counts.backlog} queued`}
            </Text>
          </View>
        </View>

        {/* Type filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterChips}
        >
          {MEDIA_TYPES.map((chip) => {
            const isActive = activeType === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                onPress={() => setActiveType(chip.key)}
              >
                <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                  {chip.key !== 'all' ? MEDIA_TYPE_EMOJIS[chip.key] + ' ' : ''}{chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content */}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyHint}>Tap + to track what you're enjoying</Text>
          </View>
        ) : (
          STATUS_SECTIONS.map(({ key, label }) => {
            const sectionItems = items.filter((i) => (i.status || 'current') === key);
            if (sectionItems.length === 0) return null;
            const isCollapsed = !!collapsed[key];

            return (
              <View key={key} style={styles.section}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleCollapse(key)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.sectionHeaderText}>{label.toUpperCase()}</Text>
                    <View style={styles.sectionCount}>
                      <Text style={styles.sectionCountText}>{sectionItems.length}</Text>
                    </View>
                  </View>
                  <Text style={styles.sectionChevron}>{isCollapsed ? '▶' : '▼'}</Text>
                </TouchableOpacity>

                {!isCollapsed && (
                  <View style={styles.sectionList}>
                    {sectionItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onPress={() => openEditItem(item)}
                        onLongPress={() => setActionItem(item)}
                        C={C}
                        F={F}
                        styles={styles}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add sheet */}
      {showAdd && renderModalForm({
        title: 'Add Item', saveLabel: 'Add item',
        onClose: () => { setShowAdd(false); resetAddForm(); },
        onSave: addItem,
        titleValue: newTitle, onTitleChange: setNewTitle,
        creatorValue: newCreator, onCreatorChange: setNewCreator,
        typeValue: newType, onTypeChange: setNewType,
        statusValue: newStatus, onStatusChange: setNewStatus,
        coverUri: newCoverUri, onPickCover: setNewCoverUri, onRemoveCover: () => setNewCoverUri(null),
        rating: newRating, onRating: setNewRating,
        review: newReview, onReviewChange: setNewReview,
        genres: newGenres, setGenres: setNewGenres,
        genreInput: newGenreInput, setGenreInput: setNewGenreInput,
      })}

      {/* Edit sheet */}
      {!!editingItem && renderModalForm({
        title: 'Edit Item', saveLabel: 'Save',
        onClose: () => setEditingItem(null),
        onSave: saveEditItem,
        titleValue: editTitle, onTitleChange: setEditTitle,
        creatorValue: editCreator, onCreatorChange: setEditCreator,
        typeValue: editType, onTypeChange: setEditType,
        statusValue: editStatus, onStatusChange: setEditStatus,
        coverUri: editCoverUri, onPickCover: setEditCoverUri, onRemoveCover: () => setEditCoverUri(null),
        rating: editRating, onRating: setEditRating,
        review: editReview, onReviewChange: setEditReview,
        genres: editGenres, setGenres: setEditGenres,
        genreInput: editGenreInput, setGenreInput: setEditGenreInput,
      })}

      {/* Quick action sheet */}
      {renderActionSheet()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:     { flex: 1, backgroundColor: C.bg },
    scroll:   { flex: 1 },
    content:  { padding: 20 },

    // Header
    pageHeader:   { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    pageTitle:    { fontSize: 26, color: C.text, fontFamily: F.heading },
    pageSubtitle: { fontSize: 13, color: C.textMuted, marginTop: 3, fontFamily: F.body },

    // Filter chips
    filterScroll:           { marginHorizontal: -20, marginBottom: 24 },
    filterChips:            { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
    filterChip:             { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.xl, borderWidth: 1 },
    filterChipActive:       { backgroundColor: C.accent, borderColor: C.accent },
    filterChipInactive:     { backgroundColor: C.bgCard, borderColor: C.border },
    filterChipText:         { fontSize: 13, fontFamily: F.body },
    filterChipTextActive:   { color: '#fff' },
    filterChipTextInactive: { color: C.text },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon:  { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontFamily: F.heading, color: C.text, marginBottom: 6 },
    emptyHint:  { fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 240, fontFamily: F.body },

    // Sections
    section:           { marginBottom: 28 },
    sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionHeaderText: { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8 },
    sectionChevron:    { fontSize: 11, color: C.textFaint },
    sectionCount:      { backgroundColor: C.accentLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
    sectionCountText:  { fontSize: 11, color: C.accent, fontFamily: F.heading },
    sectionList:       { gap: 10 },

    // Item row
    itemRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.card },
    rowCover:         { width: 72, height: 100 },
    rowCoverImage:    { width: 72, height: 100 },
    rowCoverPlaceholder: { width: 72, height: 100, alignItems: 'center', justifyContent: 'center' },
    rowCoverEmoji:    { fontSize: 28 },
    rowDetails:       { flex: 1, padding: 12, gap: 4 },
    rowTitle:         { fontSize: 15, color: C.text, fontFamily: F.heading, lineHeight: 20 },
    rowCreator:       { fontSize: 12, color: C.textMuted, fontFamily: F.body },
    rowTags:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    typeTag:          { backgroundColor: C.accentLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typeTagText:      { fontSize: 11, color: C.accent, fontFamily: F.heading },
    genreTag:         { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    genreTagText:     { fontSize: 11, color: C.textMuted, fontFamily: F.body },
    rowStars:         { flexDirection: 'row', gap: 1, marginTop: 2 },
    rowStar:          { fontSize: 12, color: C.border },
    rowStarFilled:    { color: C.accent },
    rowChevron:       { fontSize: 20, color: C.textFaint, paddingHorizontal: 12 },

    // FAB
    fab:     { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', ...SHADOW.card },
    fabText: { fontSize: 28, color: '#fff', lineHeight: 36 },

    // Action sheet
    actionSheetHeader:   { padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 8 },
    actionSheetTitle:    { fontSize: 17, fontFamily: F.heading, color: C.text },
    actionSheetSubtitle: { fontSize: 13, color: C.textMuted, fontFamily: F.body, marginTop: 2 },
    actionRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    actionRowText:       { fontSize: 16, color: C.text, fontFamily: F.body },

    // Modal
    modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:   { fontSize: 20, color: C.text, fontFamily: F.heading },
    modalClose:   { fontSize: 18, color: C.textMuted, fontFamily: F.body },
    modalBody:    { flex: 1, padding: 20 },
    modalFooter:  { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, padding: 16, backgroundColor: C.bgCard, borderTopWidth: 1, borderTopColor: C.border },

    // Form
    fieldLabel:     { fontSize: 11, fontFamily: F.heading, color: C.textFaint, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
    fieldInput:     { backgroundColor: C.bg, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    fieldInputMulti:{ minHeight: 100, textAlignVertical: 'top' },
    coverPickerBox: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, borderRadius: RADIUS.md, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
    coverPickerPreview: { width: '100%', height: 80 },
    coverPickerPlaceholderText: { fontSize: 13, color: C.textMuted, fontFamily: F.body },

    // Chips
    chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:             { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
    chipActive:       { borderColor: C.accent, backgroundColor: C.accentLight },
    chipText:         { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    chipTextActive:   { color: C.accent, fontFamily: F.heading },

    // Genre editor
    genreInputRow:         { flexDirection: 'row', gap: 8, alignItems: 'center' },
    genreAddBtn:           { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.md },
    genreAddBtnText:       { color: '#fff', fontFamily: F.heading, fontSize: 14 },
    genreChipSelected:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.xl, backgroundColor: C.accent },
    genreChipSelectedText: { fontSize: 12, color: '#fff', fontFamily: F.body },
    genreChipSuggestion:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.accent, backgroundColor: C.accentLight },
    genreChipSuggestionText: { fontSize: 12, color: C.accent, fontFamily: F.body },

    // Rating
    ratingRow:       { flexDirection: 'row', gap: 4, marginBottom: 16 },
    ratingStar:      { fontSize: 24, color: C.border },
    ratingStarActive:{ color: C.accent },

    // Footer buttons
    cancelBtn:     { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelBtnText: { fontSize: 15, color: C.textMuted, fontFamily: F.body },
    confirmBtn:    { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    confirmBtnText:{ fontSize: 15, color: '#fff', fontFamily: F.heading },
  });
}
