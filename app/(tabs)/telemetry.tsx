import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CarView } from '../../src/components/CarView';
import { Card } from '../../src/components/Card';
import { PhaseBanner } from '../../src/components/PhaseBanner';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Speedometer } from '../../src/components/Speedometer';
import { SpeedChart } from '../../src/components/SpeedChart';
import { StatusPill } from '../../src/components/StatusPill';
import { DEFAULTS } from '../../src/config';
import { PRESENTATION_MODE } from '../../src/config/release';
import { useApp } from '../../src/store/AppContext';
import { colors, radius } from '../../src/theme/colors';
import { formatCoord } from '../../src/utils/format';

function Axis({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.axis}>
      <Text style={styles.axisLabel}>{label}</Text>
      <Text style={styles.axisValue}>{value.toFixed(1)}°</Text>
    </View>
  );
}

export default function TelemetryScreen() {
  const { telemetry, speedHistory, settings, location, locationOk, mode, setDemoSpeed } = useApp();
  const { speed, pitch, roll, yaw } = telemetry;
  const locLabel = location ? 'Locked' : PRESENTATION_MODE || locationOk ? 'Acquiring' : 'Unavailable';
  const locColor = location ? colors.success : colors.warning;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Telemetry" subtitle="Live from the vehicle unit" right={<StatusPill />} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PhaseBanner />

        <Card style={{ alignItems: 'center' }}>
          <View style={{ alignSelf: 'stretch' }}>
            <SectionLabel text="Speed" />
          </View>
          <Speedometer speed={speed} limit={settings.limit} max={DEFAULTS.maxSpeed} />
        </Card>

        <Card>
          <SectionLabel text="Speed trend" />
          <SpeedChart data={speedHistory} limit={settings.limit} />
        </Card>

        <Card>
          <SectionLabel text="Vehicle attitude" />
          <View style={{ alignItems: 'center' }}>
            <CarView pitch={pitch} roll={roll} yaw={yaw} size={280} />
          </View>
          <View style={styles.axes}>
            <Axis label="Pitch" value={pitch} />
            <Axis label="Roll" value={roll} />
            <Axis label="Yaw" value={yaw} />
          </View>
        </Card>

        <Card>
          <SectionLabel text="Vehicle location" right={<Text style={{ color: locColor, fontSize: 12, fontWeight: '600' }}>{locLabel}</Text>} />
          <Text style={styles.coord}>{location ? formatCoord(location.lat, location.lng) : 'Waiting for a location fix'}</Text>
          {location?.accuracy ? <Text style={styles.acc}>Accuracy about {Math.round(location.accuracy)} m</Text> : null}
        </Card>

        {mode === 'demo' && !PRESENTATION_MODE && (
          <Card>
            <SectionLabel text="Test speed control" />
            <View style={styles.demoRow}>
              {[
                { label: 'Cruise 45', v: 45 },
                { label: 'Limit', v: settings.limit },
                { label: 'Speeding 95', v: 95 },
              ].map((b) => (
                <Pressable key={b.label} style={({ pressed }) => [styles.demoBtn, pressed && { opacity: 0.6 }]} onPress={() => setDemoSpeed(b.v)}>
                  <Text style={styles.demoText}>{b.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 28 },
  axes: { flexDirection: 'row', gap: 10, marginTop: 12 },
  axis: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 },
  axisLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  axisValue: { color: colors.text, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },
  coord: { color: colors.text, fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  acc: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  demoText: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
