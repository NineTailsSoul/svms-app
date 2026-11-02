import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { VEHICLE } from '../config';
import { colors } from '../theme/colors';
import { Phase } from '../types';

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });
const rad = (d: number) => (d * Math.PI) / 180;

// Scope-style display: bezel with bearing ticks, range rings, crosshair, rotating sweep with a fading trail
// and one tracked target. Sweep speeds up and the colour changes with the violation phase.
export function RadarScanner({ size = 280, phase }: { size?: number; phase: Phase }) {
  const tint = phase === 'breach' ? colors.danger : phase === 'warning' ? colors.warning : colors.success;
  const c = size / 2;
  const R = c - 2;
  const scopeR = R - 16;
  const p = (deg: number, r: number) => ({ x: c + r * Math.sin(rad(deg)), y: c - r * Math.cos(rad(deg)) });

  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const period = phase === 'breach' ? 1800 : phase === 'warning' ? 3000 : 5000;

  useEffect(() => {
    cancelAnimation(rot);
    const s = rot.value % 360;
    rot.value = s;
    rot.value = withRepeat(withTiming(s + 360, { duration: period, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rot);
  }, [period, rot]);

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = 0;
    if (phase !== 'normal') {
      pulse.value = withRepeat(
        withTiming(1, { duration: phase === 'breach' ? 1100 : 1800, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
    }
    return () => cancelAnimation(pulse);
  }, [phase, pulse]);

  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.75 * (1 - pulse.value),
    transform: [{ scale: 0.45 + 1.5 * pulse.value }],
  }));

  const ticks = useMemo(() => {
    const out: { key: number; a: { x: number; y: number }; b: { x: number; y: number }; major: boolean }[] = [];
    for (let d = 0; d < 360; d += 5) {
      const major = d % 30 === 0;
      const len = major ? 10 : d % 10 === 0 ? 6 : 3;
      out.push({ key: d, a: p(d, R - 2), b: p(d, R - 2 - len), major });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const slices = useMemo(() => {
    const N = 40;
    const TRAIL = 75;
    const wedge = (a0: number, a1: number) => {
      const s = p(a0, scopeR);
      const e = p(a1, scopeR);
      return `M ${c} ${c} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${scopeR} ${scopeR} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
    };
    return Array.from({ length: N }, (_, i) => ({
      d: wedge((-TRAIL * (i + 1)) / N, (-TRAIL * i) / N),
      o: 0.34 * Math.pow(1 - i / N, 1.7),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const tgt = p(52, scopeR * 0.55);
  const lead = p(0, scopeR);
  const cardinals: [string, number][] = [['N', 0], ['E', 90], ['S', 180], ['W', 270]];
  const k = 11; // reticle half-size
  const arm = 5;
  const reticle = [
    `M ${tgt.x - k} ${tgt.y - k + arm} V ${tgt.y - k} H ${tgt.x - k + arm}`,
    `M ${tgt.x + k - arm} ${tgt.y - k} H ${tgt.x + k} V ${tgt.y - k + arm}`,
    `M ${tgt.x + k} ${tgt.y + k - arm} V ${tgt.y + k} H ${tgt.x + k - arm}`,
    `M ${tgt.x - k + arm} ${tgt.y + k} H ${tgt.x - k} V ${tgt.y + k - arm}`,
  ].join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={R} fill="#0A0B0C" stroke={colors.border} strokeWidth={1.5} />
        <Circle cx={c} cy={c} r={scopeR} fill="#0D1011" stroke={colors.border} strokeWidth={1} />
        {[1 / 3, 2 / 3].map((f) => (
          <Circle key={f} cx={c} cy={c} r={scopeR * f} fill="none" stroke={colors.border} strokeWidth={1} />
        ))}
        <Line x1={c} y1={c - scopeR} x2={c} y2={c + scopeR} stroke={colors.border} strokeWidth={1} />
        <Line x1={c - scopeR} y1={c} x2={c + scopeR} y2={c} stroke={colors.border} strokeWidth={1} />
        {ticks.map((t) => (
          <Line
            key={t.key}
            x1={t.a.x}
            y1={t.a.y}
            x2={t.b.x}
            y2={t.b.y}
            stroke={t.major ? colors.textSecondary : colors.textMuted}
            strokeWidth={t.major ? 1.5 : 1}
          />
        ))}
        {cardinals.map(([label, deg]) => {
          const q = p(deg, scopeR - 12);
          return (
            <SvgText key={label} x={q.x} y={q.y + 3.5} fontSize={10} fontWeight="bold" fill={colors.textSecondary} textAnchor="middle">
              {label}
            </SvgText>
          );
        })}
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          {slices.map((s, i) => (
            <Path key={i} d={s.d} fill={tint} fillOpacity={s.o} />
          ))}
          <Line x1={c} y1={c} x2={lead.x} y2={lead.y} stroke={tint} strokeWidth={1.5} strokeOpacity={0.9} />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: tgt.x - 14, top: tgt.y - 14, width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: tint },
          pulseStyle,
        ]}
      />

      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={c} cy={c} r={2.5} fill={colors.text} />
        <Circle cx={tgt.x} cy={tgt.y} r={3.5} fill={tint} />
        {phase === 'normal' ? (
          <Circle cx={tgt.x} cy={tgt.y} r={8} fill="none" stroke={tint} strokeOpacity={0.5} strokeWidth={1} />
        ) : (
          <Path d={reticle} fill="none" stroke={tint} strokeWidth={1.5} />
        )}
        <SvgText x={tgt.x - 16} y={tgt.y + 3} fontSize={9} fontFamily={MONO} fill={colors.text} textAnchor="end">
          {VEHICLE.plate}
        </SvgText>
      </Svg>
    </View>
  );
}
