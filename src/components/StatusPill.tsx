import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PRESENTATION_MODE } from '../config/release';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme/colors';
import { LinkState } from '../types';

const MAP: Record<LinkState, { label: string; color: string }> = {
  live: { label: 'Live', color: colors.success },
  waiting: { label: 'No signal', color: colors.warning },
  offline: { label: 'Offline', color: colors.danger },
  demo: { label: 'Demo', color: colors.primaryText },
};

export function StatusPill() {
  const { link } = useApp();
  const m = link === 'demo' && PRESENTATION_MODE ? { label: 'Live', color: colors.success } : MAP[link];
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: m.color }]} />
      <Text style={[styles.text, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  dot: { width: 6, height: 6, borderRadius: 1 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
