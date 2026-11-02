// Prototype speed traces: a different, repeatable shape for every alert (seeded by the alert id).
// Real violations raised by the app use the live speed history instead (see AppContext.createAlert).
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function synthTrace(seed: string | number, peak: number, limit: number, n = 48): number[] {
  const s = typeof seed === 'number' ? seed >>> 0 : hash(seed);
  const rand = rng(s);
  const profile = s % 4;
  const base = Math.max(15, Math.min(peak - 10, limit - 6 - rand() * 18));
  const phase = rand() * Math.PI * 2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    let v: number;
    if (profile === 0) {
      // cruising, then a hard acceleration
      v = base + (peak - base) * Math.pow(Math.max(0, (x - 0.45) / 0.55), 1.8);
    } else if (profile === 1) {
      // hovering just under the limit, then a short surge
      const hold = limit - 4 + Math.sin(x * 11 + phase) * 3;
      v = x < 0.78 ? hold : hold + (peak - hold) * ((x - 0.78) / 0.22);
    } else if (profile === 2) {
      // climbs early and stays over the limit
      const climb = Math.min(1, x / 0.3);
      v = base + (limit + (peak - limit) * 0.6 - base) * climb + (peak - limit) * 0.4 * Math.pow(x, 3);
    } else {
      // weaving drift upwards
      v = base + (peak - base) * x * 0.85 + Math.sin(x * 14 + phase) * 7 * x;
    }
    v += (rand() - 0.5) * 3;
    out.push(Math.round(Math.max(0, Math.min(peak, v)) * 10) / 10);
  }
  out[n - 1] = peak;
  return out;
}
