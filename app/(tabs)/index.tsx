import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/Card';
import { PhaseBanner } from '../../src/components/PhaseBanner';
import { PlateBadge } from '../../src/components/PlateBadge';
import { RadarScanner } from '../../src/components/RadarScanner';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionLabel } from '../../src/components/SectionLabel';
import { StatTile } from '../../src/components/StatTile';
import { StatusPill } from '../../src/components/StatusPill';
import { DEFAULTS, STATION, VEHICLE } from '../../src/config';
import { PRESENTATION_MODE } from '../../src/config/release';
import { useApp } from '../../src/store/AppContext';
import { colors, radius } from '../../src/theme/colors';
import { timeAgo } from '../../src/utils/format';

function Readout({ label, value, tint, divider }: { label: string; value: string; tint?: string; divider?: boolean }) {
  return (
    <View style={[styles.cell, divider && styles.cellDivider]}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={[styles.cellValue, tint ? { color: tint } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ScanScreen() {
  const { alerts, phase, telemetry, settings, simulateAlert } = useApp();
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const today = alerts.filter((a) => a.timestamp >= startOfDay).length;
  const last = alerts[0];
  const over = telemetry.speed > settings.limit;
  const state = phase === 'normal' ? 'Monitoring' : phase === 'warning' ? 'Driver warned' : 'Violation';
  const tint = phase === 'normal' ? colors.success : phase === 'warning' ? colors.warning : colors.danger;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Scan"
        subtitle={`${STATION.code} control room`}
        right={<StatusPill />}
        onTitleLongPress={PRESENTATION_MODE ? simulateAlert : undefined}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PhaseBanner />

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.scope}>
            <RadarScanner size={290} phase={phase} />
          </View>
          <View style={styles.readout}>
            <Readout label="State" value={state} tint={tint} />
            <Readout label="Targets" value="1" divider />
            <Readout label="Speed" value={`${Math.round(telemetry.speed)} km/h`} tint={over ? colors.danger : undefined} divider />
          </View>
        </Card>

        <View style={styles.row}>
          <StatTile label="Alerts today" value={String(today)} tint={today ? colors.danger : undefined} />
          <StatTile label="Highest speed" value={alerts.length ? `${Math.max(...alerts.map((a) => a.speed))}` : '--'} />
          <StatTile label="Last alert" value={last ? timeAgo(last.timestamp) : '--'} />
        </View>

        <Card>
          <SectionLabel text="Monitored vehicle" />
          <View style={styles.vehicleTop}>
            <PlateBadge plate={VEHICLE.plate} />
            <View style={{ flex: 1 }} />
            <Text style={[styles.speed, over && { color: colors.danger }]}>{Math.round(telemetry.speed)}</Text>
            <Text style={styles.unit}> km/h</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, (telemetry.speed / DEFAULTS.maxSpeed) * 100)}%`, backgroundColor: over ? colors.danger : colors.primary },
              ]}
            />
            <View style={[styles.limitMark, { left: `${(settings.limit / DEFAULTS.maxSpeed) * 100}%` }]} />
          </View>
          <Text style={styles.limitText}>Speed limit {settings.limit} km/h</Text>
        </Card>

        {!PRESENTATION_MODE && (
          <Pressable style={({ pressed }) => [styles.sim, pressed && { opacity: 0.7 }]} onPress={simulateAlert}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.simText}>Simulate violation</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 28 },
  row: { flexDirection: 'row', gap: 10 },
  scope: { alignItems: 'center', paddingVertical: 20 },
  readout: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  cell: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  cellDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
  cellLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  cellValue: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 5, fontVariant: ['tabular-nums'] },
  vehicleTop: { flexDirection: 'row', alignItems: 'flex-end' },
  speed: { color: colors.text, fontSize: 40, fontWeight: '700', fontVariant: ['tabular-nums'] },
  unit: { color: colors.textSecondary, fontSize: 14, marginBottom: 7 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, marginTop: 14, overflow: 'visible' },
  fill: { height: 6, borderRadius: 3 },
  limitMark: { position: 'absolute', top: -4, width: 2, height: 14, backgroundColor: colors.text },
  limitText: { color: colors.textSecondary, fontSize: 12, marginTop: 10 },
  sim: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  simText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
