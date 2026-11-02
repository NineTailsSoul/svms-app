import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// Small tracked-out label used in place of icon + title headings.
export function SectionLabel({ text, right }: { text: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{text}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  text: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
});
