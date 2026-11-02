import { Alert, Telemetry } from '../types';
import { Backend } from './types';

// Demo backend: fake telemetry + in-memory alerts so the whole app works without hardware or Firebase.
const MIN = 60 * 1000;
const seed = (): Alert[] => {
  const now = Date.now();
  const rows: [string, number, number, number, number, number][] = [
    ['DL 01 AB 1234', 88, 60, 28.6139, 77.209, 12 * MIN],
    ['HR 26 CK 4471', 97, 70, 28.5355, 77.391, 55 * MIN],
    ['UP 16 BT 9082', 74, 50, 28.6692, 77.4538, 3 * 60 * MIN],
    ['DL 8C AF 5520', 112, 80, 28.7041, 77.1025, 7 * 60 * MIN],
    ['DL 3S CQ 1007', 69, 40, 28.6304, 77.2177, 26 * 60 * MIN],
    ['PB 10 GT 3315', 101, 80, 28.4595, 77.0266, 49 * 60 * MIN],
  ];
  return rows.map(([plate, speed, limit, lat, lng, ago], i) => ({
    id: `seed${i}xx${i}`,
    plate,
    speed,
    limit,
    lat,
    lng,
    timestamp: now - ago,
    status: 'Acknowledged' as const,
  }));
};

let alerts: Alert[] = seed();
let speed = 45;
let target = 45;
let timer: ReturnType<typeof setInterval> | null = null;
const t0 = Date.now();
const telListeners = new Set<(t: Telemetry) => void>();
const listListeners = new Set<(l: Alert[]) => void>();
const newListeners = new Set<(a: Alert) => void>();

function ensureTicker() {
  if (timer) return;
  timer = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    speed += (target - speed) * 0.12;
    const t: Telemetry = {
      speed: Math.round(speed * 10) / 10,
      pitch: 5 * Math.sin(s * 0.9) + (speed - 45) * 0.04,
      roll: 12 * Math.sin(s * 0.55),
      yaw: 28 * Math.sin(s * 0.3),
    };
    telListeners.forEach((l) => l(t));
  }, 200);
}

export const mockBackend: Backend = {
  mode: 'demo',

  subscribeTelemetry(cb) {
    telListeners.add(cb);
    ensureTicker();
    return () => {
      telListeners.delete(cb);
      if (telListeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  },

  subscribeAlerts(onList, onNew) {
    listListeners.add(onList);
    newListeners.add(onNew);
    onList([...alerts]);
    return () => {
      listListeners.delete(onList);
      newListeners.delete(onNew);
    };
  },

  subscribeConnection(cb) {
    cb(true);
    return () => {};
  },

  async pushAlert(a) {
    const alert: Alert = { ...a, id: `demo${Date.now().toString(36)}` };
    alerts = [alert, ...alerts];
    listListeners.forEach((l) => l([...alerts]));
    newListeners.forEach((l) => l(alert));
  },

  async clearAlerts() {
    alerts = [];
    listListeners.forEach((l) => l([]));
  },

  demo: {
    setTargetSpeed(n) {
      target = n;
    },
  },
};
