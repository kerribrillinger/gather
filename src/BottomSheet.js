import React, { useEffect, useRef } from 'react';
import {
  Modal, View, StyleSheet, Pressable, Animated,
  PanResponder, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BottomSheet({ visible, onClose, children, backgroundColor = '#fff', maxHeight = '90%', fullHeight = false }) {
  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => { translateY.setValue(600); onCloseRef.current(); });
  }

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > Math.abs(gs.dx) && gs.dy > 0,
    onPanResponderMove: (_, gs) => {
      if (gs.dy > 0) {
        translateY.setValue(gs.dy);
        backdropOpacity.setValue(Math.max(0, 1 - gs.dy / 300));
      }
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dy > 60 || gs.vy > 0.5) {
        dismiss();
      } else {
        Animated.parallel([
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.timing(backdropOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    },
  })).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity }]} pointerEvents="none" />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[styles.sheet, fullHeight ? { backgroundColor, flex: 1 } : { backgroundColor, maxHeight }, { transform: [{ translateY }] }]}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handleArea} {...pan.panHandlers}>
              <View style={styles.handle} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0 },
  handleArea: { paddingVertical: 16, alignItems: 'center' },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' },
});
