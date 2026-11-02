import React, { useMemo, useState } from 'react';
import { Alert as RNAlert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActiveCase, DoneCase } from '../../src/components/CaseCard';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { TextTabs } from '../../src/components/TextTabs';
import { CASE_CHECKIN_MS } from '../../src/config/cases';
import { useApp } from '../../src/store/AppContext';
import { colors } from '../../src/theme/colors';
import { Alert } from '../../src/types';
import { useNow } from '../../src/utils/useNow';

type Tab = 'active' | 'done';

export default function CasesScreen() {
  const { alerts, cases, openAlert, completeCase } = useApp();
  const now = useNow(1000);
  const [tab, setTab] = useState<Tab>('active');

  const active = useMemo(
    () =>
      alerts
        .filter((a) => cases[a.id]?.status === 'responding')
        .sort((x, y) => cases[y.id].ackAt - cases[x.id].ackAt),
    [alerts, cases],
  );
  const done = useMemo(
    () =>
      alerts
        .filter((a) => cases[a.id]?.status === 'completed')
        .sort((x, y) => (cases[y.id].completedAt ?? 0) - (cases[x.id].completedAt ?? 0)),
    [alerts, cases],
  );

  const confirm = (a: Alert) =>
    RNAlert.alert('Mark case completed?', `${a.plate}. Location logging for this case will stop.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark completed', onPress: () => completeCase(a.id) },
    ]);

  const every = CASE_CHECKIN_MS >= 60000 ? `${Math.round(CASE_CHECKIN_MS / 60000)} min` : `${Math.round(CASE_CHECKIN_MS / 1000)} s`;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Cases" subtitle={`${active.length} open · ${done.length} closed`} />
      <View style={styles.tabs}>
        <TextTabs<Tab>
          items={[
            { key: 'active', label: `Active (${active.length})` },
            { key: 'done', label: `Completed (${done.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'active' ? (
          active.length === 0 ? (
            <Empty title="No open cases" sub="Acknowledge a violation and it stays here until you mark it completed." />
          ) : (
            <>
              <Text style={styles.note}>Location and time are logged every {every} while a case is open.</Text>
              {active.map((a) => (
                <ActiveCase
                  key={a.id}
                  alert={a}
                  rec={cases[a.id]}
                  now={now}
                  onDetails={() => openAlert(a)}
                  onComplete={() => confirm(a)}
                />
              ))}
            </>
          )
        ) : done.length === 0 ? (
          <Empty title="Nothing closed yet" sub="Completed cases are listed here." />
        ) : (
          done.map((a) => <DoneCase key={a.id} alert={a} rec={cases[a.id]} onDetails={() => openAlert(a)} />)
        )}
      </ScrollView>
    </View>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  tabs: { paddingHorizontal: 16 },
  content: { padding: 16, gap: 12, paddingBottom: 28, flexGrow: 1 },
  note: { color: colors.textSecondary, fontSize: 12 },
  empty: { paddingTop: 56, alignItems: 'center', gap: 6, paddingHorizontal: 24 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
