import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';

const rad = (d: number) => (d * Math.PI) / 180;

// 270 degree instrument gauge: ticks, numbered scale, limit marker, digital readout.
export function Speedometer({ speed, limit, max, size = 250 }: { speed: number; limit: number; max: number; size?: number }) {
  const c = size / 2;
  const r = c - 22;
  const A0 = -135;
  const A1 = 135;
  const ang = (v: number) => A0 + (Math.max(0, Math.min(v, max)) / max) * (A1 - A0);
  const pt = (a: number, rr: number) => ({ x: c + rr * Math.sin(rad(a)), y: c - rr * Math.cos(rad(a)) });
  const arc = (a0: number, a1: number, rr: number) => {
    const s = pt(a0, rr);
    const e = pt(a1, rr);
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${rr} ${rr} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const over = speed > limit;
  const tint = over ? colors.danger : colors.primaryText;
  const marks: number[] = [];
  for (let v = 0; v <= max; v += 10) marks.push(v);
  const lim0 = pt(ang(limit), r - 8);
  const lim1 = pt(ang(limit), r + 9);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Path d={arc(A0, A1, r)} stroke={colors.border} strokeWidth={8} fill="none" />
        {speed > 0.5 && <Path d={arc(A0, ang(speed), r)} stroke={tint} strokeWidth={8} fill="none" />}
        {marks.map((v) => {
          const major = v % 20 === 0;
          const a = ang(v);
          const p0 = pt(a, r - 10);
          const p1 = pt(a, r - 10 - (major ? 10 : 5));
          const lp = pt(a, r - 34);
          return (
            <React.Fragment key={v}>
              <Line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={major ? colors.textSecondary : colors.textMuted} strokeWidth={major ? 1.5 : 1} />
              {major && (
                <SvgText x={lp.x} y={lp.y + 3.5} fontSize={10} fill={colors.textSecondary} textAnchor="middle">
                  {v}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
        <Line x1={lim0.x} y1={lim0.y} x2={lim1.x} y2={lim1.y} stroke={colors.warning} strokeWidth={3} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text style={[styles.num, over && { color: colors.danger }]}>{Math.round(speed)}</Text>
        <Text style={styles.unit}>km/h</Text>
        <Text style={styles.limit}>Limit {limit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  num: { color: colors.text, fontSize: 54, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  unit: { color: colors.textSecondary, fontSize: 13, marginTop: -4 },
  limit: { color: colors.warning, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginTop: 6, textTransform: 'uppercase' },
});
