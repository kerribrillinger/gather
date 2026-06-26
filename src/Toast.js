import React, { useRef, useState, useCallback } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';

// Module-level ref to the imperative trigger — screens import and call showToast(msg)
let _triggerToast = null;

/**
 * Call this from any screen to display a toast message.
 * @param {string} msg — The message to display
 */
export function showToast(msg) {
  if (_triggerToast) {
    _triggerToast(msg);
  }
}

/**
 * Renders the toast overlay. Place this once inside AppNavigator's return,
 * above all other content (high zIndex). It registers itself as the global
 * toast trigger on mount.
 */
export function ToastContainer() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  // Guard against overlapping toasts — cancel any in-flight animation
  const animationRef = useRef(null);

  const trigger = useCallback((msg) => {
    // Cancel any running animation sequence
    if (animationRef.current) {
      animationRef.current.stop();
    }

    setMessage(msg);
    setVisible(true);
    opacity.setValue(0);

    const fadeIn = Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    });

    const fadeOut = Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });

    // fade in → hold 2200ms → fade out
    const sequence = Animated.sequence([
      fadeIn,
      Animated.delay(2200),
      fadeOut,
    ]);

    animationRef.current = sequence;

    sequence.start(({ finished }) => {
      if (finished) {
        setVisible(false);
        setMessage('');
      }
    });
  }, [opacity]);

  // Register trigger on mount, clean up on unmount
  React.useEffect(() => {
    _triggerToast = trigger;
    return () => {
      _triggerToast = null;
    };
  }, [trigger]);

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View style={[styles.pill, { opacity }]}>
        <Text style={styles.text} numberOfLines={2}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Absolutely positioned overlay — sits above content, below modals
  wrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 500,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  pill: {
    backgroundColor: 'rgba(20,20,20,0.85)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '80%',
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
  },
});
