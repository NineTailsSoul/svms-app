import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert as RNAlert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { StatTile } from '../../src/components/StatTile';
import { TextTabs } from '../../src/components/TextTabs';
import { ViolationRow } from '../../src/components/ViolationRow';
import { useApp } from '../../src/store/AppContext';
import { colors, radius } from '../../src/theme/colors';
import { severityOf } from '../../src/utils/severity';

type Filter = 'all' | 'today' | 'severe' | 'open';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'severe', label: 'Severe' },
  { key: 'open', label: 'Open' },
];

export default function HistoryScreen() {
  const { alerts, cases, openAlert, clearAlerts } = useApp();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const s = q.replace(/\s/g, '').toLowerCase();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    return alerts.filter((a) => {
      if (filter === 'today' && a.timestamp < startOfDay) return false;
      if (filter === 'severe' && severityOf(a.speed, a.limit).label !== 'Severe') return false;
      if (filter === 'open' && cases[a.id]?.status === 'completed') return false;
      return s ? a.plate.replace(/\s/g, '').toLowerCase().includes(s) : true;
    });
  }, [alerts, cases, q, filter]);

  const peak = alerts.length ? Math.max(...alerts.map((a) => a.speed)) : 0;
  const avgOver = alerts.length ? Math.round(alerts.reduce((t, a) => t + (a.speed - a.limit), 0) / alerts.length) : 0;
  const resolved = alerts.filter((a) => cases[a.id]?.status === 'completed').length;

  const confirmClear = () =>
    RNAlert.alert('Clear history', 'Delete all recorded violations?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: () => clearAlerts() },
    ]);

  const filtering = q || filter !== 'all';

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="History"
        subtitle={`${alerts.length} violations · ${resolved} resolved`}
        right={
          alerts.length > 0 ? (
            <Pressable onPress={confirmClear} hitSlop={10} style={styles.clear}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.top}>
        <View style={styles.statsRow}>
          <StatTile icon="clipboard-list-outline" label="Total" value={String(alerts.length)} />
          <StatTile icon="speedometer" label="Peak speed" value={peak ? `${peak}` : '--'} tint={colors.warning} />
          <StatTile icon="trending-up" label="Avg over limit" value={alerts.length ? `+${avgOver}` : '--'} tint={colors.danger} />
        </View>

        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by plate number"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            style={styles.input}
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <TextTabs<Filter> items={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10, paddingBottom: 28, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{filtering ? 'No matching violations' : 'No violations yet'}</Text>
            <Text style={styles.emptySub}>{filtering ? 'Try a different search or filter.' : 'New violations will be listed here.'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ViolationRow alert={item} status={cases[item.id]?.status ?? 'new'} onPress={() => openAlert(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 16, gap: 14, paddingBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  clear: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 56 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textSecondary, fontSize: 14 },
});
