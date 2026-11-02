import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function TextTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <View style={styles.row}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable key={it.key} onPress={() => onChange(it.key)} hitSlop={6} style={[styles.tab, on && styles.tabOn]}>
            <Text style={[styles.label, on && styles.labelOn]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -StyleSheet.hairlineWidth },
  tabOn: { borderBottomColor: colors.primary },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  labelOn: { color: colors.text },
});
