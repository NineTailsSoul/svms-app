import { ESP_HOST, ESP_PORT } from '../config/esp';
import { Telemetry } from '../types';

// One shared WebSocket connection to the ESP32. Reconnects by itself, and drops a connection that goes silent.
export type EspAlert = { speed: number; limit?: number; plate?: string };

const telL = new Set<(t: Telemetry) => void>();
const alertL = new Set<(a: EspAlert) => void>();
const connL = new Set<(up: boolean) => void>();

let host = ESP_HOST;
let socket: WebSocket | null = null;
let gen = 0; // bumped whenever a socket is replaced, so late events from the old one are ignored
let up = false;
let lastMsg = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let openTimer: ReturnType<typeof setTimeout> | null = null;
let watchdog: ReturnType<typeof setInterval> | null = null;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const active = () => telL.size + alertL.size + connL.size > 0;

function setUp(v: boolean) {
  if (up === v) return;
  up = v;
  connL.forEach((f) => f(v));
}

function clearTimers() {
  if (retryTimer) clearTimeout(retryTimer);
  if (openTimer) clearTimeout(openTimer);
  retryTimer = null;
  openTimer = null;
}

function closeSocket() {
  gen++;
  const s = socket;
  socket = null;
  if (s) {
    try {
      s.close();
    } catch {}
  }
}

function scheduleRetry(ms: number) {
  if (retryTimer || !active()) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect();
  }, ms);
}

function handle(text: string) {
  let m: any;
  try {
    m = JSON.parse(text);
  } catch {
    return;
  }
  if (m.t === 'tel') {
    const t: Telemetry = { speed: num(m.speed), pitch: num(m.pitch), roll: num(m.roll), yaw: num(m.yaw) };
    telL.forEach((f) => f(t));
  } else if (m.t === 'alert') {
    const a: EspAlert = {
      speed: num(m.speed),
      limit: m.limit != null ? num(m.limit) : undefined,
      plate: typeof m.plate === 'string' ? m.plate : undefined,
    };
    alertL.forEach((f) => f(a));
  }
}

function connect() {
  if (!active()) return;
  clearTimers();
  closeSocket();
  const my = gen;
  let s: WebSocket;
  try {
    s = new WebSocket(`ws://${host}:${ESP_PORT}`);
  } catch {
    scheduleRetry(2000);
    return;
  }
  socket = s;
  // give up on a connection attempt that hangs
  openTimer = setTimeout(() => {
    if (my !== gen) return;
    closeSocket();
    setUp(false);
    scheduleRetry(500);
  }, 4000);
  s.onopen = () => {
    if (my !== gen) return;
    if (openTimer) clearTimeout(openTimer);
    lastMsg = Date.now();
    setUp(true);
  };
  s.onmessage = (e: any) => {
    if (my !== gen) return;
    lastMsg = Date.now();
    handle(String(e.data));
  };
  s.onerror = () => {};
  s.onclose = () => {
    if (my !== gen) return;
    socket = null;
    setUp(false);
    scheduleRetry(1000);
  };
}

function ensureStarted() {
  if (!watchdog) {
    // the ESP32 sends 25 messages a second, so 3 s of silence means the link is dead
    watchdog = setInterval(() => {
      if (up && Date.now() - lastMsg > 3000) {
        closeSocket();
        setUp(false);
        scheduleRetry(300);
      }
    }, 1000);
  }
  if (!socket && !retryTimer) connect();
}

function maybeStop() {
  if (active()) return;
  if (watchdog) clearInterval(watchdog);
  watchdog = null;
  clearTimers();
  closeSocket();
  up = false;
}

export const espLink = {
  onTelemetry(cb: (t: Telemetry) => void) {
    telL.add(cb);
    ensureStarted();
    return () => {
      telL.delete(cb);
      maybeStop();
    };
  },
  onAlert(cb: (a: EspAlert) => void) {
    alertL.add(cb);
    ensureStarted();
    return () => {
      alertL.delete(cb);
      maybeStop();
    };
  },
  onConnection(cb: (up: boolean) => void) {
    connL.add(cb);
    cb(up);
    ensureStarted();
    return () => {
      connL.delete(cb);
      maybeStop();
    };
  },
  // true if the text was handed to the ESP32 over the local link
  send(text: string): boolean {
    try {
      if (up && socket) {
        socket.send(text);
        return true;
      }
    } catch {}
    return false;
  },
  getHost: () => host,
  setHost(h: string) {
    host = h.trim() || ESP_HOST;
    if (active()) {
      clearTimers();
      closeSocket();
      setUp(false);
      connect();
    }
  },
};
