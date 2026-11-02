import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CaseRecord } from '../caseTypes';
import { CASE_CHECKIN_MS } from '../config/cases';
import { colors, radius } from '../theme/colors';
import { Alert } from '../types';
import { formatCountdown, formatDuration } from '../utils/duration';
import { formatCoord, formatTime, mapsLink } from '../utils/format';
import { PlateBadge } from './PlateBadge';

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ActiveCase({
  alert,
  rec,
  now,
  onDetails,
  onComplete,
}: {
  alert: Alert;
  rec: CaseRecord;
  now: number;
  onDetails: () => void;
  onComplete: () => void;
}) {
  const last = rec.track[rec.track.length - 1];
  const next = rec.lastCheckin + CASE_CHECKIN_MS - now;
  return (
    <View style={styles.card}>
      <Pressable onPress={onDetails} style={styles.head}>
        <View style={{ flex: 1, gap: 8 }}>
          <PlateBadge plate={alert.plate} />
          <Text style={styles.title}>
            {alert.speed} km/h in a {alert.limit} zone
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.status}>EN ROUTE</Text>
          <Text style={styles.elapsed}>{formatDuration(now - rec.ackAt)}</Text>
        </View>
      </Pressable>

      <View style={styles.rows}>
        <Row label="Acknowledged" value={formatTime(rec.ackAt)} />
        <Row label="Last location log" value={formatTime(last.t)} />
        <Row label="Position" value={formatCoord(last.lat, last.lng)} />
        <Row label="Next check-in" value={next > 0 ? `in ${formatCountdown(next)}` : 'due now'} />
        <Row label="Locations logged" value={String(rec.track.length)} last />
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.ghost]} onPress={onDetails}>
          <Text style={styles.ghostText}>Details</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.ghost]} onPress={() => Linking.openURL(mapsLink(alert.lat, alert.lng))}>
          <Text style={styles.ghostText}>Navigate</Text>
        </Pressable>
      </View>
      <Pressable style={({ pressed }) => [styles.btn, styles.solid, pressed && { opacity: 0.85 }]} onPress={onComplete}>
        <Text style={styles.solidText}>Mark completed</Text>
      </Pressable>
    </View>
  );
}

export function DoneCase({ alert, rec, onDetails }: { alert: Alert; rec: CaseRecord; onDetails: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, styles.doneRow, pressed && { opacity: 0.75 }]} onPress={onDetails}>
      <View style={{ flex: 1, gap: 8 }}>
        <PlateBadge plate={alert.plate} />
        <Text style={styles.doneMain}>Completed {formatTime(rec.completedAt ?? rec.ackAt)}</Text>
        <Text style={styles.doneSub}>
          Response {formatDuration((rec.completedAt ?? rec.ackAt) - rec.ackAt)} · {rec.track.length} location logs
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  status: { color: colors.primaryText, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  elapsed: { color: colors.textSecondary, fontSize: 13, marginTop: 3, fontVariant: ['tabular-nums'] },
  rows: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'], flexShrink: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radius.md },
  ghost: { borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  solid: { backgroundColor: colors.primary },
  solidText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  doneRow: { flexDirection: 'row', alignItems: 'center' },
  doneMain: { color: colors.text, fontSize: 14, fontWeight: '600' },
  doneSub: { color: colors.textSecondary, fontSize: 12 },
});
