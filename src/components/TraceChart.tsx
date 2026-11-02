import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Circle, Defs, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';

// Speed leading up to an alert. The part above the limit is drawn in red.
export function TraceChart({ data, limit, height = 150 }: { data: number[]; limit: number; height?: number }) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));

  const padL = 30;
  const padR = 14;
  const padT = 14;
  const padB = 6;
  const n = data.length;
  const yMax = Math.ceil(Math.max(limit * 1.15, ...data, 20) / 20) * 20;
  const plotW = Math.max(0, w - padL - padR);
  const plotH = height - padT - padB;
  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * plotW;
  const y = (v: number) => padT + plotH - (Math.min(v, yMax) / yMax) * plotH;
  const limY = y(limit);

  const ticks: number[] = [];
  for (let t = 0; t <= yMax; t += 40) if (Math.abs(t - limit) > yMax * 0.1) ticks.push(t);

  let content: React.ReactNode = null;
  if (w > 0 && n > 1) {
    const line = 'M ' + data.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' L ');
    const area = `${line} L ${x(n - 1).toFixed(1)} ${padT + plotH} L ${x(0).toFixed(1)} ${padT + plotH} Z`;
    const last = data[n - 1];
    const lx = x(n - 1);
    const ly = y(last);
    const labelY = ly - 9 < padT + 6 ? ly + 17 : ly - 9;
    content = (
      <Svg width={w} height={height}>
        <Defs>
          <ClipPath id="over">
            <Rect x={0} y={0} width={w} height={limY} />
          </ClipPath>
          <ClipPath id="under">
            <Rect x={0} y={limY} width={w} height={height - limY} />
          </ClipPath>
        </Defs>
        {ticks.map((t) => (
          <React.Fragment key={t}>
            <Line x1={padL} y1={y(t)} x2={w - padR} y2={y(t)} stroke={colors.border} strokeWidth={1} />
            <SvgText x={padL - 6} y={y(t) + 3} fontSize={10} fill={colors.textMuted} textAnchor="end">
              {t}
            </SvgText>
          </React.Fragment>
        ))}
        <Path d={area} fill={colors.primary} fillOpacity={0.14} clipPath="url(#under)" />
        <Path d={area} fill={colors.danger} fillOpacity={0.2} clipPath="url(#over)" />
        <Line x1={padL} y1={limY} x2={w - padR} y2={limY} stroke={colors.warning} strokeWidth={1} strokeDasharray="4 4" />
        <SvgText x={padL - 6} y={limY + 3} fontSize={10} fill={colors.warning} textAnchor="end">
          {limit}
        </SvgText>
        <Path d={line} stroke={colors.primaryText} strokeWidth={2} fill="none" strokeLinejoin="round" clipPath="url(#under)" />
        <Path d={line} stroke={colors.danger} strokeWidth={2} fill="none" strokeLinejoin="round" clipPath="url(#over)" />
        <Circle cx={lx} cy={ly} r={4} fill={last > limit ? colors.danger : colors.primaryText} stroke={colors.surface} strokeWidth={2} />
        <SvgText x={lx + 2} y={labelY} fontSize={11} fontWeight="bold" fill={colors.text} textAnchor="end">
          {`${Math.round(last)} km/h`}
        </SvgText>
      </Svg>
    );
  }

  return (
    <View>
      <View onLayout={onLayout} style={{ height }}>
        {content}
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisText}>Earlier</Text>
        <Text style={styles.axisText}>Alert</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 30, paddingRight: 8, marginTop: 4 },
  axisText: { color: colors.textMuted, fontSize: 11 },
});
