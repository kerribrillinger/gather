import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useTheme, useFont } from '../AppContext';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

// ── Inline markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text, baseStyle, C, F) {
  if (!text) return null;
  const parts = [];
  // Split on **bold** and _italic_
  const regex = /(\*\*(.+?)\*\*|_(.+?)_)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<Text key={key++} style={baseStyle}>{text.slice(last, match.index)}</Text>);
    }
    if (match[0].startsWith('**')) {
      parts.push(<Text key={key++} style={[baseStyle, { fontFamily: F.heading }]}>{match[2]}</Text>);
    } else {
      parts.push(<Text key={key++} style={[baseStyle, { fontFamily: F.italic || F.body }]}>{match[3]}</Text>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(<Text key={key++} style={baseStyle}>{text.slice(last)}</Text>);
  }
  return parts;
}

function NotePreview({ note, onPress, onDelete, C, styles }) {
  const preview = note.body.replace(/\*\*|_/g, '').slice(0, 80);
  const date = new Date(note.updatedAt).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
        <Text style={styles.notePreview} numberOfLines={2}>{preview || 'Empty note'}</Text>
      </View>
      <View style={styles.noteMeta}>
        <Text style={styles.noteDate}>{date}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={16} color={C.textFaint} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function NotesScreen() {
  const { state, setState } = useApp();
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const notes = state.notesList || [];
  const [activeId, setActiveId] = useState(null);
  const inputRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const activeNote = notes.find(n => n.id === activeId);

  function createNote() {
    const note = { id: generateId(), title: '', body: '', updatedAt: new Date().toISOString() };
    setState(s => ({ ...s, notesList: [note, ...(s.notesList || [])] }));
    setActiveId(note.id);
  }

  function updateNote(id, changes) {
    setState(s => ({
      ...s,
      notesList: (s.notesList || []).map(n =>
        n.id === id ? { ...n, ...changes, updatedAt: new Date().toISOString() } : n
      ),
    }));
  }

  function deleteNote(id) {
    setState(s => ({ ...s, notesList: (s.notesList || []).filter(n => n.id !== id) }));
    if (activeId === id) setActiveId(null);
  }

  function wrapSelection(wrapper) {
    if (!activeNote) return;
    const { start, end } = selectionRef.current;
    const body = activeNote.body;
    const selected = body.slice(start, end);
    const wrapped = `${wrapper}${selected}${wrapper}`;
    const newBody = body.slice(0, start) + wrapped + body.slice(end);
    updateNote(activeId, { body: newBody });
  }

  // ── Editor view ─────────────────────────────────────────────────────────────
  if (activeNote) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setActiveId(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <TextInput
              style={styles.titleInput}
              value={activeNote.title}
              onChangeText={t => updateNote(activeId, { title: t })}
              placeholder="Title"
              placeholderTextColor={C.textFaint}
              returnKeyType="next"
            />
          </View>

          {/* Formatting toolbar */}
          <View style={[styles.toolbar, { backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => wrapSelection('**')}>
              <Text style={[styles.toolbarBtnText, { fontFamily: F.heading }]}>B</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => wrapSelection('_')}>
              <Text style={[styles.toolbarBtnText, { fontFamily: F.italic || F.body, fontStyle: F.italic ? 'normal' : 'italic' }]}>I</Text>
            </TouchableOpacity>
            <View style={styles.toolbarDivider} />
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => {
              const { start } = selectionRef.current;
              const body = activeNote.body;
              const lineStart = body.lastIndexOf('\n', start - 1) + 1;
              const newBody = body.slice(0, lineStart) + '• ' + body.slice(lineStart);
              updateNote(activeId, { body: newBody });
            }}>
              <Ionicons name="list-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Editor */}
          <TextInput
            ref={inputRef}
            style={styles.editor}
            multiline
            value={activeNote.body}
            onChangeText={t => updateNote(activeId, { body: t })}
            placeholder="Start writing…"
            placeholderTextColor={C.textFaint}
            textAlignVertical="top"
            autoCorrect
            spellCheck
            onSelectionChange={e => { selectionRef.current = e.nativeEvent.selection; }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Notes</Text>
        <Text style={styles.subtitle}>Quick thoughts, on the go</Text>
      </View>

      {notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No notes yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={n => n.id}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <NotePreview
              note={item}
              C={C}
              styles={styles}
              onPress={() => setActiveId(item.id)}
              onDelete={() => deleteNote(item.id)}
            />
          )}
        />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: C.accent }]} onPress={createNote}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(C, F = {}) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: C.bg },
    listHeader:      { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    title:           { fontSize: 26, fontFamily: F.heading, color: C.text },
    subtitle:        { fontSize: 14, fontFamily: F.body, color: C.textMuted, marginTop: 2 },
    fab:             { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    // Note cards
    noteCard:        { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...SHADOW.card },
    noteTitle:       { fontSize: 15, fontFamily: F.heading, color: C.text, marginBottom: 4 },
    notePreview:     { fontSize: 13, fontFamily: F.body, color: C.textMuted, lineHeight: 20 },
    noteMeta:        { alignItems: 'flex-end', gap: 8 },
    noteDate:        { fontSize: 11, fontFamily: F.body, color: C.textFaint },
    // Empty state
    empty:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText:       { fontSize: 15, fontFamily: F.body, color: C.textMuted },
    // Editor
    editorHeader:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
    backBtn:         { padding: 4 },
    titleInput:      { flex: 1, fontSize: 20, fontFamily: F.heading, color: C.text },
    toolbar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, gap: 4 },
    toolbarBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    toolbarBtnText:  { fontSize: 16, color: C.text },
    toolbarDivider:  { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 4 },
    editor:          { flex: 1, fontSize: 15, fontFamily: F.body, color: C.text, lineHeight: 26, padding: 20, textAlignVertical: 'top' },
  });
}
