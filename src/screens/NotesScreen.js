import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Modal, ScrollView,
  Image, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useTheme, useFont } from '../AppContext';
import { useAlert } from '../AppAlert';
import { generateId } from '../storage';
import { RADIUS, SHADOW } from '../theme';

// ── MSN emoticon map ─────────────────────────────────────────────────────────
const MSN_LIST = [
  'smile','open-mouthed-smile','surprised-smile','crying-face','winking-smile',
  'hot-smile','sad-smile','embarrassed-smile','disappointed-smile','angry-smile',
  'baring-teeth-smile','confused-smile','nerd-smile','sick-smile','sarcastic-smile',
  'dont-tell-anyone-smile','secret-telling-smile','thinking-smile','sleepy-smile',
  'eye-rolling-smile','i-dont-know-smile','smile-with-tongue-out','party-smile',
  'devil','angel','red-heart','broken-heart','red-rose','wilted-rose',
  'thumbs-up','thumbs-down','high-five','left-hug','right-hug',
  'red-lips','star','rainbow','sun','storm-cloud','lightning',
  'sleeping-half-moon','umbrella','island-with-a-palm-tree',
  'birthday-cake','pizza','beer-mug','martini-glass','coffee-cup',
  'bowl','plate','snail','turtle','bunny','cat-face','dog-face','goat',
  'black-sheep','vampire-bat','boy','girl',
  'airplane','auto','mobile-phone','telephone-receiver','computer','messenger',
  'e-mail','camera','filmstrip','note','clock','light-bulb','money',
  'gift-with-a-bow','soccer-ball','be-right-back',
];

// Require all MSN images at build time (Metro bundler needs static requires)
const MSN_IMAGES = {
  'smile': require('../../assets/msn/smile.png'),
  'open-mouthed-smile': require('../../assets/msn/open-mouthed-smile.png'),
  'surprised-smile': require('../../assets/msn/surprised-smile.png'),
  'crying-face': require('../../assets/msn/crying-face.png'),
  'winking-smile': require('../../assets/msn/winking-smile.png'),
  'hot-smile': require('../../assets/msn/hot-smile.png'),
  'sad-smile': require('../../assets/msn/sad-smile.png'),
  'embarrassed-smile': require('../../assets/msn/embarrassed-smile.png'),
  'disappointed-smile': require('../../assets/msn/disappointed-smile.png'),
  'angry-smile': require('../../assets/msn/angry-smile.png'),
  'baring-teeth-smile': require('../../assets/msn/baring-teeth-smile.png'),
  'confused-smile': require('../../assets/msn/confused-smile.png'),
  'nerd-smile': require('../../assets/msn/nerd-smile.png'),
  'sick-smile': require('../../assets/msn/sick-smile.png'),
  'sarcastic-smile': require('../../assets/msn/sarcastic-smile.png'),
  'dont-tell-anyone-smile': require('../../assets/msn/dont-tell-anyone-smile.png'),
  'secret-telling-smile': require('../../assets/msn/secret-telling-smile.png'),
  'thinking-smile': require('../../assets/msn/thinking-smile.png'),
  'sleepy-smile': require('../../assets/msn/sleepy-smile.png'),
  'eye-rolling-smile': require('../../assets/msn/eye-rolling-smile.png'),
  'i-dont-know-smile': require('../../assets/msn/i-dont-know-smile.png'),
  'smile-with-tongue-out': require('../../assets/msn/smile-with-tongue-out.png'),
  'party-smile': require('../../assets/msn/party-smile.png'),
  'devil': require('../../assets/msn/devil.png'),
  'angel': require('../../assets/msn/angel.png'),
  'red-heart': require('../../assets/msn/red-heart.png'),
  'broken-heart': require('../../assets/msn/broken-heart.png'),
  'red-rose': require('../../assets/msn/red-rose.png'),
  'wilted-rose': require('../../assets/msn/wilted-rose.png'),
  'thumbs-up': require('../../assets/msn/thumbs-up.png'),
  'thumbs-down': require('../../assets/msn/thumbs-down.png'),
  'high-five': require('../../assets/msn/high-five.png'),
  'left-hug': require('../../assets/msn/left-hug.png'),
  'right-hug': require('../../assets/msn/right-hug.png'),
  'red-lips': require('../../assets/msn/red-lips.png'),
  'star': require('../../assets/msn/star.png'),
  'rainbow': require('../../assets/msn/rainbow.png'),
  'sun': require('../../assets/msn/sun.png'),
  'storm-cloud': require('../../assets/msn/storm-cloud.png'),
  'lightning': require('../../assets/msn/lightning.png'),
  'sleeping-half-moon': require('../../assets/msn/sleeping-half-moon.png'),
  'umbrella': require('../../assets/msn/umbrella.png'),
  'island-with-a-palm-tree': require('../../assets/msn/island-with-a-palm-tree.png'),
  'birthday-cake': require('../../assets/msn/birthday-cake.png'),
  'pizza': require('../../assets/msn/pizza.png'),
  'beer-mug': require('../../assets/msn/beer-mug.png'),
  'martini-glass': require('../../assets/msn/martini-glass.png'),
  'coffee-cup': require('../../assets/msn/coffee-cup.png'),
  'bowl': require('../../assets/msn/bowl.png'),
  'plate': require('../../assets/msn/plate.png'),
  'snail': require('../../assets/msn/snail.png'),
  'turtle': require('../../assets/msn/turtle.png'),
  'bunny': require('../../assets/msn/bunny.png'),
  'cat-face': require('../../assets/msn/cat-face.png'),
  'dog-face': require('../../assets/msn/dog-face.png'),
  'goat': require('../../assets/msn/goat.png'),
  'black-sheep': require('../../assets/msn/black-sheep.png'),
  'vampire-bat': require('../../assets/msn/vampire-bat.png'),
  'boy': require('../../assets/msn/boy.png'),
  'girl': require('../../assets/msn/girl.png'),
  'airplane': require('../../assets/msn/airplane.png'),
  'auto': require('../../assets/msn/auto.png'),
  'mobile-phone': require('../../assets/msn/mobile-phone.png'),
  'telephone-receiver': require('../../assets/msn/telephone-receiver.png'),
  'computer': require('../../assets/msn/computer.png'),
  'messenger': require('../../assets/msn/messenger.png'),
  'e-mail': require('../../assets/msn/e-mail.png'),
  'camera': require('../../assets/msn/camera.png'),
  'filmstrip': require('../../assets/msn/filmstrip.png'),
  'note': require('../../assets/msn/note.png'),
  'clock': require('../../assets/msn/clock.png'),
  'light-bulb': require('../../assets/msn/light-bulb.png'),
  'money': require('../../assets/msn/money.png'),
  'gift-with-a-bow': require('../../assets/msn/gift-with-a-bow.png'),
  'soccer-ball': require('../../assets/msn/soccer-ball.png'),
  'be-right-back': require('../../assets/msn/be-right-back.png'),
};

// ── Emoji data ───────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = {
  'Faces':    ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️'],
  'People':   ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','💪','💋','👶','🧒','👦','👧','🧑','👱','👨','👩','🧓','👴','👵'],
  'Nature':   ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🦄','🐝','🦋','🐌','🐞','🐢','🐍','🦎','🐙','🐠','🐟','🐬','🐳','🦈','🐊','🐘','🦒','🦘','🐕','🐈','🌸','🌺','🌻','🌹','🌷','🌼','🍀','🌿','🍃','🍂','🍁','🌱','🌲','🌴','🌵','🍄','☀️','🌈','⭐','🌙','❄️','🌊','🌋','🏔️'],
  'Food':     ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥝','🍅','🥑','🥦','🥕','🌽','🍔','🍟','🍕','🌮','🌯','🍜','🍣','🍱','🍦','🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭','☕','🍵','🥤','🧋','🍺','🍻','🥂','🍷','🍸','🍹'],
  'Travel':   ['🚗','🚕','🚙','🚌','🚓','🚑','🚒','🏎️','🏍️','🚲','🛵','✈️','🚀','🛸','🚁','⛵','🚢','🏠','🏡','🏢','🏥','🏦','🏨','🏪','🏫','🗼','🗽','⛪','🕌','🕋','🏕️','🏖️','🏜️','🏝️','🌋','🗺️','🧭'],
  'Objects':  ['⌚','📱','💻','⌨️','🖥️','📷','📸','📹','🎥','📞','☎️','📺','📻','💡','🔦','🕯️','🔑','🗝️','🔐','🔒','🔓','🧲','🔧','🔨','⚙️','⚖️','🔬','🔭','💊','🩹','💉','🧪','🎁','🏆','🎯','🎲','🎮','🎵','🎶','🎸','🎹','🎺','🥁','📚','✏️','📝','📖','📅','📌','📎','✂️','🗑️','💰','💳'],
  'Symbols':  ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','☮️','✝️','☪️','⭐','🔥','✨','💫','🌟','💯','❌','✅','⭕','❓','❗','💤','🔔','🔕','🔇','🔈','🔉','🔊','📢','📣','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪'],
};

// ── Strip desktop HTML from synced notes ─────────────────────────────────────
// Desktop stores notes as rich HTML (contenteditable). Mobile is plain text.
// This converts HTML to readable plain text while preserving [msn:name] shortcodes
// and also converts inline <img class="notes-msn-emoji"> tags to shortcodes.
function htmlToPlainText(input) {
  if (!input) return '';
  // Already plain text — no HTML tags present
  if (!input.includes('<')) return input;
  let s = input;
  // Convert MSN img tags to shortcodes before stripping
  s = s.replace(/<img[^>]+class="notes-msn-emoji"[^>]*>/gi, (tag) => {
    const src = tag.match(/src="msn-emoticons\/([^"]+)\.png"/);
    const alt = tag.match(/alt="([^"]+)"/);
    const name = src ? src[1] : (alt ? alt[1].replace(/ /g, '-') : null);
    return name ? `[msn:${name}]` : '';
  });
  // Block elements → newlines
  s = s.replace(/<\/?(div|p|br|li|ul|ol)[^>]*>/gi, '\n');
  // Strip all remaining tags
  s = s.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  s = s.replace(/&nbsp;/gi, ' ')
       .replace(/&amp;/gi, '&')
       .replace(/&lt;/gi, '<')
       .replace(/&gt;/gi, '>')
       .replace(/&quot;/gi, '"')
       .replace(/&#39;/gi, "'");
  // Collapse 3+ newlines to 2
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// ── Render note body with MSN shortcodes ─────────────────────────────────────
// MSN shortcodes are stored as [msn:name] in the body text
function NoteBodyRenderer({ body, bodyStyle, C }) {
  if (!body) return null;
  // Split on [msn:name] tokens
  const parts = body.split(/(\[msn:[^\]]+\])/g);
  return (
    <Text style={bodyStyle}>
      {parts.map((part, i) => {
        const match = part.match(/^\[msn:([^\]]+)\]$/);
        if (match && MSN_IMAGES[match[1]]) {
          return (
            <Image
              key={i}
              source={MSN_IMAGES[match[1]]}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ── Emoji picker modal ───────────────────────────────────────────────────────
function EmojiPicker({ visible, onClose, onSelectEmoji, onSelectMsn, C, F }) {
  const [tab, setTab] = useState('emoji');
  const [emojiCat, setEmojiCat] = useState('Faces');
  const catKeys = Object.keys(EMOJI_CATEGORIES);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose} />
      <View style={[pickerStyles.sheet, { backgroundColor: C.bgCard }]}>
        {/* Mode toggle */}
        <View style={[pickerStyles.modeRow, { borderBottomColor: C.border }]}>
          <TouchableOpacity
            style={[pickerStyles.modeBtn, tab === 'emoji' && { backgroundColor: C.accent }]}
            onPress={() => setTab('emoji')}
          >
            <Text style={[pickerStyles.modeBtnText, { color: tab === 'emoji' ? '#fff' : C.textMuted }]}>😊 Emoji</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[pickerStyles.modeBtn, tab === 'msn' && { backgroundColor: C.accent }]}
            onPress={() => setTab('msn')}
          >
            <Text style={[pickerStyles.modeBtnText, { color: tab === 'msn' ? '#fff' : C.textMuted }]}>🟡 MSN</Text>
          </TouchableOpacity>
        </View>

        {tab === 'emoji' ? (
          <>
            {/* Category tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={pickerStyles.catScroll} contentContainerStyle={{ gap: 4, paddingHorizontal: 12, paddingVertical: 8 }}>
              {catKeys.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setEmojiCat(cat)}
                  style={[pickerStyles.catBtn, emojiCat === cat && { backgroundColor: C.accent }]}
                >
                  <Text style={{ fontSize: 18 }}>{EMOJI_CATEGORIES[cat][0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[pickerStyles.catLabel, { color: C.textMuted }]}>{emojiCat}</Text>
            <FlatList
              data={EMOJI_CATEGORIES[emojiCat]}
              keyExtractor={(e, i) => `${e}-${i}`}
              numColumns={8}
              style={{ maxHeight: 220 }}
              contentContainerStyle={{ padding: 8, gap: 2 }}
              columnWrapperStyle={{ gap: 2 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={pickerStyles.emojiBtn} onPress={() => { onSelectEmoji(item); onClose(); }}>
                  <Text style={{ fontSize: 22 }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        ) : (
          <FlatList
            data={MSN_LIST}
            keyExtractor={name => name}
            numColumns={8}
            style={{ maxHeight: 280 }}
            contentContainerStyle={{ padding: 8, gap: 2 }}
            columnWrapperStyle={{ gap: 2 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={pickerStyles.emojiBtn} onPress={() => { onSelectMsn(item); onClose(); }}>
                <Image source={MSN_IMAGES[item]} style={{ width: 26, height: 26 }} resizeMode="contain" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet:        { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32, elevation: 8 },
  modeRow:      { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1 },
  modeBtn:      { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.06)' },
  modeBtnText:  { fontSize: 13, fontWeight: '600' },
  catScroll:    { flexGrow: 0 },
  catBtn:       { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  catLabel:     { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingBottom: 4 },
  emojiBtn:     { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
});

// ── Note preview ─────────────────────────────────────────────────────────────
function NotePreview({ note, onPress, onDelete, C, F, styles }) {
  const preview = htmlToPlainText(note.body || '').replace(/\[msn:[^\]]+\]/g, '').replace(/\*\*|_/g, '').slice(0, 80);
  const d = note.updatedAt ? new Date(note.updatedAt) : null;
  const date = d && !isNaN(d) ? d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) : '';
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

// ── Main screen ──────────────────────────────────────────────────────────────
export default function NotesScreen({ route }) {
  const { state, setState } = useApp();
  const showAlert = useAlert();
  const C = useTheme();
  const F = useFont();
  const styles = useMemo(() => makeStyles(C, F), [C, F]);

  const notes = state.notesList || [];
  const [activeId, setActiveId] = useState(route?.params?.openId || null);

  // Re-open a specific note when navigated here with a new openId param
  React.useEffect(() => {
    const openId = route?.params?.openId;
    if (openId) setActiveId(openId);
  }, [route?.params?.openId]);
  const inputRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [editingBody, setEditingBody] = useState(false);

  const activeNote = notes.find(n => n.id === activeId);

  function createNote() {
    const note = { id: generateId(), title: '', body: '', updatedAt: new Date().toISOString() };
    setState(s => ({ ...s, notesList: [note, ...(s.notesList || [])] }));
    setActiveId(note.id);
    setEditingBody(true);
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
    showAlert({
      title: 'Delete note',
      message: 'This will permanently delete this note.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            setState(s => ({ ...s, notesList: (s.notesList || []).filter(n => n.id !== id) }));
            if (activeId === id) setActiveId(null);
          },
        },
      ],
    });
  }

  // Insert text at cursor position
  function insertAtCursor(insertion) {
    if (!activeNote) return;
    const { start, end } = selectionRef.current;
    const body = activeNote.body;
    const newBody = body.slice(0, start) + insertion + body.slice(end);
    updateNote(activeId, { body: newBody });
    // Move cursor after inserted text
    const newPos = start + insertion.length;
    setTimeout(() => {
      inputRef.current?.setNativeProps({ selection: { start: newPos, end: newPos } });
    }, 0);
  }

  function wrapSelection(wrapper) {
    if (!activeNote) return;
    const { start, end } = selectionRef.current;
    const body = activeNote.body;
    const selected = body.slice(start, end);
    const newBody = body.slice(0, start) + `${wrapper}${selected}${wrapper}` + body.slice(end);
    updateNote(activeId, { body: newBody });
  }

  function insertBullet() {
    if (!activeNote) return;
    const { start } = selectionRef.current;
    const body = activeNote.body;
    const lineStart = body.lastIndexOf('\n', start - 1) + 1;
    const newBody = body.slice(0, lineStart) + '• ' + body.slice(lineStart);
    updateNote(activeId, { body: newBody });
  }

  function insertNumberedItem() {
    if (!activeNote) return;
    const { start } = selectionRef.current;
    const body = activeNote.body;
    // Count existing numbered items above cursor to auto-increment
    const textAbove = body.slice(0, start);
    const lines = textAbove.split('\n');
    let count = 0;
    for (const line of lines) { if (/^\d+\.\s/.test(line)) count++; }
    const lineStart = body.lastIndexOf('\n', start - 1) + 1;
    const newBody = body.slice(0, lineStart) + `${count + 1}. ` + body.slice(lineStart);
    updateNote(activeId, { body: newBody });
  }

  // ── Editor view ─────────────────────────────────────────────────────────────
  if (activeNote) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => {
              if (!activeNote.title.trim() && !activeNote.body.trim()) {
                setState(s => ({ ...s, notesList: (s.notesList || []).filter(n => n.id !== activeId) }));
              }
              setActiveId(null);
            }} style={styles.backBtn}>
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
            <TouchableOpacity onPress={() => deleteNote(activeId)} style={styles.backBtn}>
              <Ionicons name="trash-outline" size={20} color={C.textFaint} />
            </TouchableOpacity>
          </View>

          {/* Formatting toolbar */}
          <View style={[styles.toolbar, { backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => wrapSelection('**')}>
              <Text style={[styles.toolbarBtnText, { fontFamily: F.heading }]}>B</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => wrapSelection('_')}>
              <Text style={[styles.toolbarBtnText, { fontFamily: F.italic || F.body, fontStyle: F.italic ? 'normal' : 'italic' }]}>I</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => wrapSelection('~~')}>
              <Text style={[styles.toolbarBtnText, { textDecorationLine: 'line-through' }]}>S</Text>
            </TouchableOpacity>
            <View style={styles.toolbarDivider} />
            <TouchableOpacity style={styles.toolbarBtn} onPress={insertBullet}>
              <Ionicons name="list-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={insertNumberedItem}>
              <Ionicons name="list-circle-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
            <View style={styles.toolbarDivider} />
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => setEmojiPickerVisible(true)}>
              <Text style={{ fontSize: 17 }}>😊</Text>
            </TouchableOpacity>
          </View>

          {/* Editor — read view shows MSN images; tap to switch to edit mode */}
          {editingBody ? (
            <TextInput
              ref={inputRef}
              style={styles.editor}
              multiline
              value={htmlToPlainText(activeNote.body)}
              onChangeText={t => updateNote(activeId, { body: t })}
              placeholder="Start writing…"
              placeholderTextColor={C.textFaint}
              textAlignVertical="top"
              autoCorrect
              spellCheck
              autoFocus
              onSelectionChange={e => { selectionRef.current = e.nativeEvent.selection; }}
              onBlur={() => setEditingBody(false)}
            />
          ) : (
            <Pressable style={[styles.editor, { minHeight: 200 }]} onPress={() => setEditingBody(true)}>
              {activeNote.body
                ? <NoteBodyRenderer body={htmlToPlainText(activeNote.body)} bodyStyle={{ fontFamily: F.body, fontSize: 15, color: C.text, lineHeight: 22 }} C={C} />
                : <Text style={{ fontFamily: F.body, fontSize: 15, color: C.textFaint }}>Start writing…</Text>
              }
            </Pressable>
          )}
        </KeyboardAvoidingView>

        <EmojiPicker
          visible={emojiPickerVisible}
          onClose={() => setEmojiPickerVisible(false)}
          onSelectEmoji={emoji => insertAtCursor(emoji)}
          onSelectMsn={name => insertAtCursor(`[msn:${name}]`)}
          C={C}
          F={F}
        />
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
              F={F}
              styles={styles}
              onPress={() => { setActiveId(item.id); setEditingBody(false); }}
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
    noteCard:        { backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...SHADOW.card },
    noteTitle:       { fontSize: 15, fontFamily: F.heading, color: C.text, marginBottom: 4 },
    notePreview:     { fontSize: 13, fontFamily: F.body, color: C.textMuted, lineHeight: 20 },
    noteMeta:        { alignItems: 'flex-end', gap: 8 },
    noteDate:        { fontSize: 11, fontFamily: F.body, color: C.textFaint },
    empty:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText:       { fontSize: 15, fontFamily: F.body, color: C.textMuted },
    editorHeader:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
    backBtn:         { padding: 4 },
    titleInput:      { flex: 1, fontSize: 20, fontFamily: F.heading, color: C.text },
    toolbar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, gap: 2 },
    toolbarBtn:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    toolbarBtnText:  { fontSize: 16, color: C.text },
    toolbarDivider:  { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 4 },
    editor:          { flex: 1, fontSize: 15, fontFamily: F.body, color: C.text, lineHeight: 26, padding: 20, textAlignVertical: 'top' },
  });
}
