import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme/colors';

// In-app notice shown on every case check-in.
export function CheckinToast({ toast, onHide }: { toast: { id: number; text: string } | null; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onHide, 4500);
    return () => clearTimeout(t);
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;
  return (
    <Animated.View
      key={toast.id}
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.wrap, { top: insets.top + 8 }]}
      pointerEvents="none"
    >
      <View style={styles.bar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{toast.text}</Text>
        <Text style={styles.sub}>Location and time logged</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 900,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingRight: 14,
    overflow: 'hidden',
  },
  bar: { width: 3, backgroundColor: colors.warning, marginLeft: -1 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
