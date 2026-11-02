// Tiny 3D engine for the attitude view: ONE cube rotated by the MPU6050 angles, with direction axes.
// Orthographic projection, back-faces culled, flat shading, painter-sorted. No GL / no extra libraries.
//
// World frame: X = front, Y = right, Z = up.
// If the cube tilts the wrong way once the sensor is mounted, flip these signs.
export const PITCH_SIGN = 1; // + = front up
export const ROLL_SIGN = 1; // + = right side down
export const YAW_SIGN = 1; // + = front turns right (clockwise from above)

type V = [number, number, number];
export type Face = { points: string; fill: string };
export type Axis = { x1: number; y1: number; x2: number; y2: number; color: string };
export type Scene = { faces: Face[]; axesBack: Axis[]; axesFront: Axis[]; grid: [number, number, number, number][] };

const rad = (d: number) => (d * Math.PI) / 180;
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const rotX = (v: V, a: number): V => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
const rotY = (v: V, a: number): V => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const rotZ = (v: V, a: number): V => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.round(Math.min(255, ((n >> s) & 255) * k));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

// camera: front-right, slightly above
const AZ = rad(35);
const EL = rad(28);
const ZC: V = [Math.cos(EL) * Math.cos(AZ), Math.cos(EL) * Math.sin(AZ), Math.sin(EL)];
const XC = norm([-ZC[1], ZC[0], 0]);
const YC: V = [ZC[1] * XC[2] - ZC[2] * XC[1], ZC[2] * XC[0] - ZC[0] * XC[2], ZC[0] * XC[1] - ZC[1] * XC[0]];
const LIGHT = norm([0.3, -0.4, 0.86]);

const H = 0.8; // half the cube's edge
const FACE = { front: '#3C74B0', rear: '#9A3B36', side: '#6A7280', top: '#8B93A1', bottom: '#2A2F36' };
const AXES: { dir: V; color: string }[] = [
  { dir: [1, 0, 0], color: '#E5534B' }, // X front
  { dir: [0, 1, 0], color: '#4CB782' }, // Y right
  { dir: [0, 0, 1], color: '#5B9BE0' }, // Z up
];

export function projectScene(pitch: number, roll: number, yaw: number, width: number, height: number): Scene {
  const s = width / 6.2;
  const ox = width / 2;
  const oy = height * 0.52;
  const toScreen = (p: V): [number, number] => [ox + dot(p, XC) * s, oy - dot(p, YC) * s];
  const body = (v: V): V =>
    rotZ(rotY(rotX(v, -rad(roll) * ROLL_SIGN), -rad(pitch) * PITCH_SIGN), -rad(yaw) * YAW_SIGN);

  const out: { depth: number; face: Face }[] = [];
  for (let axis = 0; axis < 3; axis++) {
    for (const dir of [-1, 1]) {
      const n: V = [0, 0, 0];
      n[axis] = dir;
      const nw = body(n);
      if (dot(nw, ZC) <= 0) continue; // facing away from the camera
      const u = (axis + 1) % 3;
      const w = (axis + 2) % 3;
      const corners: V[] = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => {
        const p: V = [0, 0, 0];
        p[axis] = dir * H;
        p[u] = a * H;
        p[w] = b * H;
        return body(p);
      });
      const base = axis === 0 ? (dir > 0 ? FACE.front : FACE.rear) : axis === 1 ? FACE.side : dir > 0 ? FACE.top : FACE.bottom;
      const k = 0.55 + 0.45 * Math.max(0, dot(nw, LIGHT));
      const depth = corners.reduce((t, p) => t + dot(p, ZC), 0) / 4;
      out.push({ depth, face: { points: corners.map((p) => toScreen(p).join(',')).join(' '), fill: shade(base, k) } });
    }
  }
  out.sort((a, b) => a.depth - b.depth); // far first

  // axis arrows stick out of the cube; the ones pointing away from the camera are drawn behind it
  const axesBack: Axis[] = [];
  const axesFront: Axis[] = [];
  for (const a of AXES) {
    const p0 = body([a.dir[0] * H, a.dir[1] * H, a.dir[2] * H]);
    const p1 = body([a.dir[0] * H * 2, a.dir[1] * H * 2, a.dir[2] * H * 2]);
    const [x1, y1] = toScreen(p0);
    const [x2, y2] = toScreen(p1);
    (dot(p1, ZC) >= 0 ? axesFront : axesBack).push({ x1, y1, x2, y2, color: a.color });
  }

  // fixed ground grid so the tilt reads against something that does not move
  const grid: Scene['grid'] = [];
  for (let g = -2.4; g <= 2.41; g += 0.8) {
    const a = toScreen([g, -2.4, -1.5]);
    const b = toScreen([g, 2.4, -1.5]);
    const c = toScreen([-2.4, g, -1.5]);
    const d = toScreen([2.4, g, -1.5]);
    grid.push([a[0], a[1], b[0], b[1]], [c[0], c[1], d[0], d[1]]);
  }
  return { faces: out.map((o) => o.face), axesBack, axesFront, grid };
}
