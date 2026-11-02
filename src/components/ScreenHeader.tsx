import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

// `subtitle` is shown as a small label above the title.
export function ScreenHeader({
  title,
  subtitle,
  right,
  onTitleLongPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onTitleLongPress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <Pressable style={{ flex: 1 }} onLongPress={onTitleLongPress} delayLongPress={1800} disabled={!onTitleLongPress}>
        {subtitle ? <Text style={styles.eyebrow}>{subtitle}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </Pressable>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginBottom: 14,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eyebrow: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
});
