import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { APP_NAME } from '../config/release';
import { colors } from '../theme/colors';

type Step = { key: string; label: string };

// Start-up screen that sits on top of the app until every step is ready (or a safety timeout passes).
export function BootScreen({
  steps,
  ready,
  minMs = 1800,
  maxMs = 9000,
}: {
  steps: Step[];
  ready: Record<string, boolean>;
  minMs?: number;
  maxMs?: number;
}) {
  const [minPassed, setMinPassed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [gone, setGone] = useState(false);
  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);

  const done = steps.filter((s) => ready[s.key]).length;
  const leaving = (done === steps.length && minPassed) || timedOut;

  useEffect(() => {
    const a = setTimeout(() => setMinPassed(true), minMs);
    const b = setTimeout(() => setTimedOut(true), maxMs);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [minMs, maxMs]);

  useEffect(() => {
    progress.value = withTiming(steps.length ? done / steps.length : 1, { duration: 350 });
  }, [done, steps.length, progress]);

  useEffect(() => {
    if (!leaving) return;
    opacity.value = withTiming(0, { duration: 400 });
    const t = setTimeout(() => setGone(true), 430);
    return () => clearTimeout(t);
  }, [leaving, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (gone) return null;

  return (
    <Animated.View style={[styles.root, fade]} pointerEvents={leaving ? 'none' : 'auto'}>
      <View style={styles.center}>
        <Text style={styles.name}>{APP_NAME}</Text>
        <View style={styles.rule} />
        <View style={styles.steps}>
          {steps.map((s) => {
            const ok = !!ready[s.key];
            return (
              <View key={s.key} style={styles.step}>
                <View style={[styles.box, ok && styles.boxOn]} />
                <Text style={[styles.label, ok && styles.labelOn]}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, bar]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg, zIndex: 1000 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 38, fontWeight: '800', letterSpacing: 8, marginRight: -8 },
  rule: { width: 36, height: 2, backgroundColor: colors.primary, marginTop: 14, marginBottom: 40 },
  steps: { gap: 12, width: 210 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 8, height: 8, borderRadius: 2, borderWidth: 1, borderColor: colors.textMuted },
  boxOn: { backgroundColor: colors.success, borderColor: colors.success },
  label: { color: colors.textMuted, fontSize: 14 },
  labelOn: { color: colors.textSecondary },
  track: { height: 2, backgroundColor: colors.border },
  fill: { height: 2, backgroundColor: colors.primary },
});
