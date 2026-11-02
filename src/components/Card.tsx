import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme/colors';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Kept for compatibility; the screens now use SectionLabel.
export function CardTitle({ icon, title, right }: { icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
});
