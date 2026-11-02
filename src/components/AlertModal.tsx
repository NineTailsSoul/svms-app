import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { STATION } from '../config';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme/colors';
import { Alert } from '../types';
import { caseId, formatCoord, formatTime, mapsLink } from '../utils/format';
import { severityOf } from '../utils/severity';
import { MapWebView } from './MapWebView';
import { PlateBadge } from './PlateBadge';
import { SectionLabel } from './SectionLabel';
import { TraceChart } from './TraceChart';

function Cell({ label, value, tint, divider }: { label: string; value: string; tint?: string; divider?: boolean }) {
  return (
    <View style={[styles.cell, divider && styles.cellDivider]}>
      <Text style={[styles.cellValue, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// One global modal: opens automatically for new alerts and when a history / case item is tapped.
export function AlertModal() {
  const router = useRouter();
  const { activeAlert, closeAlert, cases, acknowledgeCase, getTrace } = useApp();
  const lastRef = useRef<Alert | null>(null);
  if (activeAlert) lastRef.current = activeAlert;
  const a = activeAlert ?? lastRef.current;
  const rec = a ? cases[a.id] : undefined;
  const trace = useMemo(() => (a ? getTrace(a) : []), [a?.id, getTrace]); // eslint-disable-line react-hooks/exhaustive-deps
  const sev = a ? severityOf(a.speed, a.limit) : null;
  const isNew = !rec;

  const acknowledge = () => {
    if (!a) return;
    acknowledgeCase(a);
    router.navigate('/cases');
  };

  const statusText = rec?.status === 'completed' ? 'Completed' : rec ? 'Officer en route' : 'Dispatched';

  return (
    <Modal visible={!!activeAlert} transparent animationType="fade" statusBarTranslucent onRequestClose={closeAlert}>
      <View style={styles.backdrop}>
        {a && sev && (
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>
                  Case {caseId(a.id)} · <Text style={{ color: sev.color }}>{sev.label}</Text>
                </Text>
                <Text style={styles.title}>Overspeed violation</Text>
              </View>
              <Pressable onPress={closeAlert} hitSlop={12} style={styles.close}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 4 }}>
              <PlateBadge plate={a.plate} large />

              <View style={styles.strip}>
                <Cell label="Recorded" value={`${a.speed} km/h`} tint={sev.color} />
                <Cell label="Limit" value={`${a.limit} km/h`} divider />
                <Cell label="Over limit" value={`+${Math.max(0, a.speed - a.limit)}`} tint={colors.warning} divider />
              </View>

              <View>
                <SectionLabel text="Speed before the alert" />
                <TraceChart data={trace} limit={a.limit} />
              </View>

              <View>
                <SectionLabel text="Location" right={<Text style={styles.coord}>{formatCoord(a.lat, a.lng)}</Text>} />
                <MapWebView lat={a.lat} lng={a.lng} height={180} />
              </View>

              <View style={styles.rows}>
                <Row label="Reported" value={formatTime(a.timestamp)} />
                <Row label="Assigned station" value={STATION.code} />
                {rec ? <Row label="Acknowledged" value={formatTime(rec.ackAt)} /> : null}
                {rec?.completedAt ? <Row label="Completed" value={formatTime(rec.completedAt)} /> : null}
                <Row label="Status" value={statusText} last />
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => Linking.openURL(mapsLink(a.lat, a.lng))}>
                <MaterialCommunityIcons name="navigation-variant-outline" size={18} color={colors.primaryText} />
                <Text style={[styles.btnText, { color: colors.primaryText }]}>Navigate</Text>
              </Pressable>
              {isNew ? (
                <Pressable style={[styles.btn, styles.btnSolid]} onPress={acknowledge}>
                  <MaterialCommunityIcons name="check" size={18} color={colors.white} />
                  <Text style={[styles.btnText, { color: colors.white }]}>Acknowledge</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.btn, styles.btnGhost, { borderColor: colors.border }]} onPress={closeAlert}>
                  <Text style={[styles.btnText, { color: colors.text }]}>Close</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 16, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  eyebrow: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  close: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  strip: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  cell: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  cellDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
  cellValue: { color: colors.text, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cellLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  coord: { color: colors.textSecondary, fontSize: 12, fontVariant: ['tabular-nums'] },
  rows: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: radius.md },
  btnGhost: { borderWidth: 1, borderColor: colors.primary },
  btnSolid: { backgroundColor: colors.primary },
  btnText: { fontSize: 15, fontWeight: '700' },
});
