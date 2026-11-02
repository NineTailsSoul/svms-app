import React, { useEffect, useMemo, useRef, useState } from 'react';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { colors } from '../theme/colors';
import { Axis, projectScene } from '../utils/cube3d';

// 3D cube driven by pitch / roll / yaw. Eases toward each new reading so
// a few updates per second from the cloud still look smooth.
export function CarView({ pitch, roll, yaw, size = 280 }: { pitch: number; roll: number; yaw: number; size?: number }) {
  const [a, setA] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const target = useRef({ pitch, roll, yaw });
  target.current = { pitch, roll, yaw };

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setA((cur) => {
        const t = target.current;
        const d = t.yaw - cur.yaw;
        const dyaw = d - 360 * Math.round(d / 360); // shortest way round
        if (Math.abs(t.pitch - cur.pitch) < 0.05 && Math.abs(t.roll - cur.roll) < 0.05 && Math.abs(dyaw) < 0.05) return cur;
        return { pitch: cur.pitch + (t.pitch - cur.pitch) * 0.2, roll: cur.roll + (t.roll - cur.roll) * 0.2, yaw: cur.yaw + dyaw * 0.2 };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const height = Math.round(size * 0.8);
  const scene = useMemo(() => projectScene(a.pitch, a.roll, a.yaw, size, height), [a, size, height]);

  const axis = (ax: Axis, key: string) => (
    <React.Fragment key={key}>
      <Line x1={ax.x1} y1={ax.y1} x2={ax.x2} y2={ax.y2} stroke={ax.color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={ax.x2} cy={ax.y2} r={3.5} fill={ax.color} />
    </React.Fragment>
  );

  return (
    <Svg width={size} height={height}>
      {scene.grid.map((g, i) => (
        <Line key={i} x1={g[0]} y1={g[1]} x2={g[2]} y2={g[3]} stroke={colors.border} strokeWidth={1} />
      ))}
      {scene.axesBack.map((ax, i) => axis(ax, `b${i}`))}
      {scene.faces.map((f, i) => (
        <Polygon key={i} points={f.points} fill={f.fill} stroke="#0F1012" strokeWidth={1} strokeLinejoin="round" />
      ))}
      {scene.axesFront.map((ax, i) => axis(ax, `f${i}`))}
    </Svg>
  );
}
