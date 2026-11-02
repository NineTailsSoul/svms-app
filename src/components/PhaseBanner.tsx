import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme/colors';

// Shown for 10 seconds after a new alert arrives.
export function PhaseBanner() {
  const { phase } = useApp();
  if (phase !== 'breach') return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.bar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Violation reported</Text>
        <Text style={styles.sub}>A new alert has come in.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingRight: 14, overflow: 'hidden' },
  bar: { width: 3, backgroundColor: colors.danger },
  title: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
