import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/colors';

// `icon` is accepted for compatibility but no longer drawn.
export function StatTile({ label, value, tint }: { icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: string; tint?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tint ? { color: tint } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 12 },
  label: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  value: { color: colors.text, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 6 },
});
