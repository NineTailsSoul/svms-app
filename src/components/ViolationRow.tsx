import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaseStatus } from '../caseTypes';
import { colors, radius } from '../theme/colors';
import { Alert } from '../types';
import { formatTime } from '../utils/format';
import { severityOf } from '../utils/severity';
import { PlateBadge } from './PlateBadge';

export function SeverityPill({ speed, limit }: { speed: number; limit: number }) {
  const s = severityOf(speed, limit);
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const STATUS: Record<CaseStatus, { label: string; color: string }> = {
  new: { label: 'Dispatched', color: colors.textSecondary },
  responding: { label: 'En route', color: colors.primaryText },
  completed: { label: 'Completed', color: colors.success },
};

export function ViolationRow({
  alert,
  onPress,
  plain,
  status = 'new',
}: {
  alert: Alert;
  onPress: () => void;
  plain?: boolean;
  status?: CaseStatus;
}) {
  const s = severityOf(alert.speed, alert.limit);
  const st = STATUS[status];
  return (
    <Pressable
      style={({ pressed }) => [styles.item, plain ? styles.plain : styles.boxed, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={[styles.bar, { backgroundColor: s.color }]} />
      <View style={{ flex: 1, gap: 6 }}>
        <PlateBadge plate={alert.plate} />
        <Text style={styles.time}>
          {formatTime(alert.timestamp)} · <Text style={{ color: st.color, fontWeight: '600' }}>{st.label}</Text>
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={styles.speed}>
          {alert.speed}
          <Text style={styles.unit}> km/h</Text>
        </Text>
        <SeverityPill speed={alert.speed} limit={alert.limit} />
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, overflow: 'hidden' },
  boxed: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  plain: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
  bar: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  time: { color: colors.textSecondary, fontSize: 12 },
  speed: { color: colors.text, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  unit: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  pillText: { fontSize: 11, fontWeight: '700' },
});
