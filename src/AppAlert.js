// Themed in-app replacement for Alert.alert — matches Gather palette + font
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, useFont } from './AppContext';
import { RADIUS, SHADOW } from './theme';

const AlertContext = createContext(null);

export function AppAlertProvider({ children }) {
  const [config, setConfig] = useState(null);

  const showAlert = useCallback(({ title, message, buttons }) => {
    setConfig({ title, message, buttons: buttons || [{ text: 'OK' }] });
  }, []);

  const dismiss = useCallback(() => setConfig(null), []);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      {config && <AppAlertModal config={config} onDismiss={dismiss} />}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}

function AppAlertModal({ config, onDismiss }) {
  const C = useTheme();
  const F = useFont();
  const s = makeStyles(C, F);

  function handlePress(btn) {
    onDismiss();
    if (btn.onPress) btn.onPress();
  }

  const hasDestructive = config.buttons.some((b) => b.style === 'destructive');

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={s.overlay}>
        <View style={s.box}>
          {!!config.title && <Text style={s.title}>{config.title}</Text>}
          {!!config.message && <Text style={s.message}>{config.message}</Text>}
          <View style={[s.btnRow, config.buttons.length > 2 && s.btnCol]}>
            {config.buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel && !hasDestructive;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.btn,
                    config.buttons.length === 2 && s.btnHalf,
                    isDestructive && s.btnDestructive,
                    isPrimary && s.btnPrimary,
                    isCancel && s.btnCancel,
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text
                    style={[
                      s.btnText,
                      isDestructive && s.btnTextDestructive,
                      isPrimary && s.btnTextPrimary,
                      isCancel && s.btnTextCancel,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(C, F) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    box: {
      backgroundColor: C.bgCard,
      borderRadius: RADIUS.lg,
      padding: 24,
      width: '100%',
      maxWidth: 340,
      ...SHADOW.card,
    },
    title: {
      fontSize: 17,
      fontFamily: F.heading,
      color: C.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      fontFamily: F.body,
      color: C.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    btnRow: {
      flexDirection: 'row',
      gap: 10,
    },
    btnCol: {
      flexDirection: 'column',
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.border,
    },
    btnHalf: {
      flex: 1,
    },
    btnPrimary: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    btnDestructive: {
      backgroundColor: 'transparent',
      borderColor: '#D9534F',
    },
    btnCancel: {
      backgroundColor: C.bg,
      borderColor: C.border,
    },
    btnText: {
      fontSize: 15,
      fontFamily: F.body,
      color: C.text,
    },
    btnTextPrimary: {
      color: '#fff',
      fontFamily: F.heading,
    },
    btnTextDestructive: {
      color: '#D9534F',
      fontFamily: F.heading,
    },
    btnTextCancel: {
      color: C.textMuted,
    },
  });
}
