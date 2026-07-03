import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Image, TextInput,
  Alert, Dimensions, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { showToast } from '../Toast';
import { generateId } from '../storage';
import { RADIUS } from '../theme';

const PHOTOS_DIR = FileSystem.documentDirectory + 'gather-photos/';

async function ensurePhotosDir() {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
}

async function savePhotoToDisk(uri) {
  await ensurePhotosDir();
  // Compress and resize to max 1200px wide — keeps file size small
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  const filename = `${generateId()}.jpg`;
  const dest = PHOTOS_DIR + filename;
  await FileSystem.copyAsync({ from: manipulated.uri, to: dest });
  return dest;
}

async function deletePhotoFromDisk(src) {
  if (!src || src.startsWith('data:')) return; // skip legacy base64 entries
  try {
    const info = await FileSystem.getInfoAsync(src);
    if (info.exists) await FileSystem.deleteAsync(src, { idempotent: true });
  } catch (_) {}
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLS = 3;
const SIDE_PADDING = 20;
const GAP = 2;
const THUMB_SIZE = Math.floor((SCREEN_WIDTH - SIDE_PADDING * 2 - GAP * (COLS - 1)) / COLS);

export default function PhotosScreen() {
  const { state, setState } = useApp();
  const showAlert = useAlert();
  const insets = useSafeAreaInsets();
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const [reorderMode, setReorderMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const lightboxOpen = lightboxIndex >= 0;
  const touchStartX = useRef(0);

  const [previewUri, setPreviewUri] = useState(null);
  const [captionInput, setCaptionInput] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const photos = state.photos || [];

  async function openImagePicker() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ title: 'Permission required', message: 'Please allow photo access in your device settings to add photos.', buttons: [{ text: 'OK' }] });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (result.assets.length === 1) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setCaptionInput('');
        setAddModalOpen(true);
      } else {
        try {
          const saved = await Promise.all(
            result.assets.map(async (asset) => ({
              id: generateId(),
              src: await savePhotoToDisk(asset.uri),
              caption: '',
            }))
          );
          setState((s) => ({ ...s, photos: [...(s.photos || []), ...saved] }));
          showToast(`${saved.length} photos added`);
        } catch (_) {
          showToast('Failed to save photos');
        }
      }
    }
  }

  async function savePhoto() {
    if (!previewUri) return;
    try {
      const src = await savePhotoToDisk(previewUri);
      const newPhoto = { id: generateId(), src, caption: captionInput.trim() };
      setState((s) => ({ ...s, photos: [...(s.photos || []), newPhoto] }));
      setAddModalOpen(false);
      setPreviewUri(null);
      setCaptionInput('');
      showToast('Photo added');
    } catch (_) {
      showToast('Failed to save photo');
    }
  }

  function cancelAdd() {
    setAddModalOpen(false);
    setPreviewUri(null);
    setCaptionInput('');
  }

  function deletePhoto(photoId) {
    showAlert({
      title: 'Delete photo',
      message: 'This will permanently delete the photo. This cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const photo = photos.find((p) => p.id === photoId);
            if (photo) await deletePhotoFromDisk(photo.src);
            setState((s) => ({ ...s, photos: (s.photos || []).filter((p) => p.id !== photoId) }));
            setLightboxIndex(-1);
          },
        },
      ],
    });
  }

  function movePhoto(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    setState((s) => {
      const next = [...(s.photos || [])];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...s, photos: next };
    });
  }

  function lightboxPrev() { setLightboxIndex((i) => Math.max(0, i - 1)); }
  function lightboxNext() { setLightboxIndex((i) => Math.min(photos.length - 1, i + 1)); }

  function handleLightboxTouchStart(e) { touchStartX.current = e.nativeEvent.pageX; }
  function handleLightboxTouchEnd(e) {
    const delta = e.nativeEvent.pageX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) lightboxNext();
      else lightboxPrev();
    }
  }

  const currentPhoto = lightboxOpen ? photos[lightboxIndex] : null;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Photos</Text>
          <Text style={styles.pageSubtitle}>Your moments</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {photos.length > 1 && !deleteMode && (
            <TouchableOpacity
              style={[styles.editBtn, reorderMode && styles.editBtnActive]}
              onPress={() => setReorderMode((v) => !v)}
            >
              <Text style={[styles.editBtnText, reorderMode && styles.editBtnTextActive]}>
                {reorderMode ? 'Done' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          )}
          {deleteMode && (
            <TouchableOpacity
              style={[styles.editBtn, styles.editBtnActive]}
              onPress={() => setDeleteMode(false)}
            >
              <Text style={[styles.editBtnText, styles.editBtnTextActive]}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {reorderMode && (
        <Text style={styles.reorderHint}>Tap the arrows to move a photo.</Text>
      )}
      {deleteMode && (
        <Text style={styles.reorderHint}>Tap ✕ to delete a photo.</Text>
      )}

      {/* Grid */}
      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🖼️</Text>
          <Text style={styles.emptyText}>No photos yet. Tap + to add some.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
        >
          <View style={styles.gridWrap}>
            {photos.map((photo, index) => (
              <View key={photo.id} style={styles.thumbWrapper}>
                <TouchableOpacity
                  activeOpacity={reorderMode ? 1 : 0.85}
                  onPress={() => { if (!reorderMode && !deleteMode) setLightboxIndex(index); }}
                  onLongPress={() => { if (!reorderMode) setDeleteMode(true); }}
                  delayLongPress={400}
                  style={styles.thumbTouchable}
                >
                  <Image source={{ uri: photo.src }} style={[styles.thumb, deleteMode && styles.thumbDeleteMode]} />
                  {!!photo.caption && (
                    <View style={styles.thumbCaption}>
                      <Text style={styles.thumbCaptionText} numberOfLines={1}>{photo.caption}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {deleteMode && (
                  <TouchableOpacity
                    style={styles.deleteBadge}
                    onPress={() => deletePhoto(photo.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.deleteBadgeText}>✕</Text>
                  </TouchableOpacity>
                )}

                {reorderMode && (
                  <View style={styles.arrowOverlay}>
                    <TouchableOpacity
                      style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                      onPress={() => movePhoto(index, -1)}
                      disabled={index === 0}
                    >
                      <Text style={styles.arrowText}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.arrowBtn, index === photos.length - 1 && styles.arrowBtnDisabled]}
                      onPress={() => movePhoto(index, 1)}
                      disabled={index === photos.length - 1}
                    >
                      <Text style={styles.arrowText}>→</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Photo Modal */}
      <Modal visible={addModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: C.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            <TouchableOpacity onPress={cancelAdd}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {previewUri && (
              <Image source={{ uri: previewUri }} style={styles.addPreviewImage} resizeMode="contain" />
            )}
            <Text style={styles.fieldLabel}>CAPTION (optional)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Add a caption…"
              placeholderTextColor={C.textFaint}
              value={captionInput}
              onChangeText={setCaptionInput}
              returnKeyType="done"
            />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelAdd}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, !previewUri && { opacity: 0.4 }]} onPress={savePhoto} disabled={!previewUri}>
              <Text style={styles.confirmBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* FAB — hidden in reorder mode */}
      {!reorderMode && (
        <TouchableOpacity style={styles.fab} onPress={openImagePicker}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Lightbox */}
      <Modal visible={lightboxOpen} animationType="fade" transparent>
        <View
          style={styles.lightbox}
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <TouchableOpacity style={[styles.lightboxClose, { top: insets.top + 12 }]} onPress={() => setLightboxIndex(-1)}>
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>

          {currentPhoto && (
            <Image source={{ uri: currentPhoto.src }} style={styles.lightboxImage} resizeMode="contain" />
          )}

          {!!currentPhoto?.caption && (
            <Text style={styles.lightboxCaption}>{currentPhoto.caption}</Text>
          )}

          {lightboxIndex > 0 && (
            <TouchableOpacity style={styles.lightboxArrowLeft} onPress={lightboxPrev}>
              <Text style={styles.lightboxArrowText}>‹</Text>
            </TouchableOpacity>
          )}

          {lightboxIndex < photos.length - 1 && (
            <TouchableOpacity style={styles.lightboxArrowRight} onPress={lightboxNext}>
              <Text style={styles.lightboxArrowText}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:             { flex: 1, backgroundColor: C.bg },
    pageHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
    pageTitle:        { fontSize: 26, color: C.text, fontFamily: F.heading },
    pageSubtitle:     { fontSize: 14, color: C.textMuted, marginTop: 2, fontFamily: F.body },
    editBtn:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border },
    editBtnActive:    { backgroundColor: C.accent, borderColor: C.accent },
    editBtnText:      { fontSize: 13, color: C.textMuted, fontFamily: F.body },
    editBtnTextActive:{ color: '#fff', fontFamily: F.heading },
    reorderHint:      { fontSize: 12, color: C.textFaint, paddingHorizontal: 20, marginBottom: 10, marginTop: -4, fontFamily: F.body },
    // Grid
    gridContent:      { paddingHorizontal: SIDE_PADDING, paddingBottom: 100 },
    gridWrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    thumbWrapper:     { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 6, overflow: 'hidden', position: 'relative' },
    thumbTouchable:   { width: THUMB_SIZE, height: THUMB_SIZE },
    thumb:            { width: THUMB_SIZE, height: THUMB_SIZE },
    thumbCaption:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 3 },
    thumbCaptionText: { color: '#fff', fontSize: 10 },
    thumbDeleteMode:  { opacity: 0.7 },
    deleteBadge:      { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(200,50,50,0.9)', alignItems: 'center', justifyContent: 'center' },
    deleteBadgeText:  { color: '#fff', fontSize: 11, fontWeight: 'bold', lineHeight: 14 },
    // Reorder arrows
    arrowOverlay:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 4, paddingVertical: 4 },
    arrowBtn:         { paddingHorizontal: 6, paddingVertical: 2 },
    arrowBtnDisabled: { opacity: 0.25 },
    arrowText:        { color: '#fff', fontSize: 16, fontFamily: F.heading },
    // Empty
    emptyState:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyIcon:        { fontSize: 40, marginBottom: 12 },
    emptyText:        { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22, fontFamily: F.body },
    // Add modal
    modal:            { flex: 1 },
    modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle:       { fontSize: 20, fontFamily: F.heading, color: C.text },
    modalClose:       { fontSize: 18, color: C.textMuted, fontFamily: F.body },
    modalBody:        { flex: 1, padding: 20 },
    addPreviewImage:  { width: '100%', height: 260, borderRadius: RADIUS.md, marginBottom: 24, backgroundColor: C.border },
    fieldLabel:       { fontSize: 11, fontFamily: F.heading, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8 },
    fieldInput:       { backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: F.body },
    modalFooter:      { flexDirection: 'row', gap: 12, padding: 20 },
    cancelBtn:        { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelBtnText:    { fontSize: 15, color: C.textMuted, fontFamily: F.body },
    confirmBtn:       { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: C.accent, alignItems: 'center' },
    confirmBtnText:   { fontSize: 15, color: '#fff', fontFamily: F.heading },
    // FAB
    fab:              { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    fabText:          { fontSize: 28, color: '#fff', lineHeight: 36 },
    // Lightbox
    lightbox:         { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
    lightboxClose:    { position: 'absolute', top: 52, right: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    lightboxCloseText:{ color: '#fff', fontSize: 18, fontFamily: F.heading },
    lightboxImage:    { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
    lightboxCaption:  { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 24, marginTop: 16, lineHeight: 20, fontFamily: F.body },
    lightboxArrowLeft:  { position: 'absolute', left: 12, top: '50%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    lightboxArrowRight: { position: 'absolute', right: 12, top: '50%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    lightboxArrowText:  { color: '#fff', fontSize: 28, fontFamily: F.body, lineHeight: 36 },
    lightboxDeleteBtn:  { backgroundColor: 'rgba(200,80,50,0.8)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, marginTop: 16 },
    lightboxDeleteText: { color: '#fff', fontSize: 14, fontFamily: F.heading },
  });
}
