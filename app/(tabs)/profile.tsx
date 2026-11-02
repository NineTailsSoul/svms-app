import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert as RNAlert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionLabel } from '../../src/components/SectionLabel';
import { STATION, VEHICLE } from '../../src/config';
import { PRESENTATION_MODE } from '../../src/config/release';
import { useApp } from '../../src/store/AppContext';
import { colors, radius } from '../../src/theme/colors';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Stepper({ label, value, unit, onMinus, onPlus }: { label: string; value: number; unit: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowValue}>{label}</Text>
        <Text style={[styles.rowLabel, { marginTop: 2 }]}>{value} {unit}</Text>
      </View>
      <Pressable style={styles.stepBtn} onPress={onMinus} hitSlop={6}>
        <MaterialCommunityIcons name="minus" size={20} color={colors.text} />
      </Pressable>
      <Pressable style={styles.stepBtn} onPress={onPlus} hitSlop={6}>
        <MaterialCommunityIcons name="plus" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

// "Insp. Rajesh Kumar" -> "RK"
const initials = (name: string) =>
  name
    .split(' ')
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export default function ProfileScreen() {
  const { settings, setSettings, mode } = useApp();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" subtitle="Station and settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.officer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(STATION.officer)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{STATION.officer}</Text>
            <Text style={styles.rowLabel}>{STATION.rank}</Text>
            <Text style={[styles.rowLabel, { marginTop: 2 }]}>Badge {STATION.badge}</Text>
          </View>
        </Card>

        <Card>
          <SectionLabel text="Police station" />
          <Row label="Station" value={STATION.name} />
          <Row label="Code" value={STATION.code} />
          <Row label="Jurisdiction" value={STATION.zone} />
          <Row label="Shift" value={STATION.shift} />
          <Row label="Control room" value={STATION.phone} />
        </Card>

        <Card>
          <SectionLabel text="Enforcement" />
          <Stepper
            label="Speed limit"
            value={settings.limit}
            unit="km/h"
            onMinus={() => setSettings({ limit: Math.max(20, settings.limit - 5) })}
            onPlus={() => setSettings({ limit: Math.min(120, settings.limit + 5) })}
          />
        </Card>

        <Card>
          <SectionLabel text="System" />
          <Row label="Monitored vehicle" value={VEHICLE.plate} />
          {!PRESENTATION_MODE && <Row label="Data source" value={mode === 'demo' ? 'Test data' : 'Firebase Realtime Database'} />}
          <Row label="App version" value="1.0.0" />
        </Card>

        <Pressable style={styles.signOut} onPress={() => RNAlert.alert('Sign out', 'Sign-in is not enabled in this prototype.')}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 28 },
  officer: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  stepBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  signOut: { alignItems: 'center', paddingVertical: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
