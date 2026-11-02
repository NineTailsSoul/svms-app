import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

const W = 300;
const H = 100;

// Recent speed trend with the limit drawn as a dashed line
export function SpeedChart({ data, limit }: { data: number[]; limit: number }) {
  const yMax = Math.max(limit * 1.4, ...data, 20);
  const y = (v: number) => H - (Math.min(v, yMax) / yMax) * H;
  const n = data.length;
  const pts = data.map((v, i) => `${(i / Math.max(1, 59)) * W + (W - ((n - 1) / 59) * W)} ${y(v)}`);
  const line = n > 1 ? `M ${pts.join(' L ')}` : '';
  const area = n > 1 ? `${line} L ${W} ${H} L ${W - ((n - 1) / 59) * W} ${H} Z` : '';
  const over = n > 0 && data[n - 1] > limit;
  const tint = over ? colors.danger : colors.primary;

  return (
    <View>
      <Svg width="100%" height={110} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Line x1={0} y1={y(limit)} x2={W} y2={y(limit)} stroke={colors.warning} strokeWidth={1} strokeDasharray="4 4" />
        {n > 1 && <Path d={area} fill={tint} fillOpacity={0.12} />}
        {n > 1 && <Path d={line} stroke={tint} strokeWidth={2} fill="none" strokeLinejoin="round" />}
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Last 60 readings</Text>
        <Text style={[styles.legendText, { color: colors.warning }]}>Limit {limit} km/h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendText: { color: colors.textSecondary, fontSize: 12 },
});
