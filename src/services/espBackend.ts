import { DEFAULTS, VEHICLE } from '../config';
import { Alert } from '../types';
import { espLink } from './espLink';
import { firebaseBackend } from './firebaseBackend';
import { getLastLocation } from './locationService';
import { Backend } from './types';

// TELEMETRY has two routes, chosen automatically:
//   1. straight from the ESP32 over the local network (WebSocket)           <- used whenever it is alive
//   2. relayed through Firebase by the Chromebook bridge page (USB cable)   <- used only while route 1 is silent
// ALERTS from the ESP32 (route 1) are shown at once and saved to Firebase; alerts relayed by the bridge arrive from Firebase.

let fbList: Alert[] = []; // alerts known to Firebase
let local: Alert[] = []; // alerts shown immediately, not yet confirmed by Firebase
const announced = new Set<string>(); // ids already announced through onNew
let emit: (() => void) | null = null;
let announce: ((a: Alert) => void) | null = null;
let lastEspAlertAt = 0;

async function ingest(data: Omit<Alert, 'id'>) {
  const id = firebaseBackend.newAlertId(); // the id is made on the phone, so it never changes later
  if (emit && announce) {
    const a = { id, ...data } as Alert;
    local = [a, ...local];
    announced.add(id);
    emit();
    announce(a);
  }
  await firebaseBackend.saveAlert(id, data); // uploads now, or as soon as the internet is back
}

export const espBackend: Backend = {
  ...firebaseBackend,
  mode: 'firebase',

  subscribeTelemetry(cb) {
    let lastEsp = 0;
    const u1 = espLink.onTelemetry((t) => {
      lastEsp = Date.now();
      cb(t);
    });
    // Route 2. The first Firebase value is the old one stored from last time, so it is skipped.
    let firstFb = true;
    const u3 = firebaseBackend.subscribeTelemetry((t) => {
      if (firstFb) {
        firstFb = false;
        return;
      }
      if (Date.now() - lastEsp > 2000) cb(t); // only while the direct link is silent
    });
    const u2 = espLink.onAlert((m) => {
      const now = Date.now();
      if (now - lastEspAlertAt < 1500) return; // ignore an accidental double send
      lastEspAlertAt = now;
      const loc = getLastLocation(); // the ESP32 has no GPS, so the phone supplies the location
      ingest({
        plate: m.plate || VEHICLE.plate,
        speed: Math.round(m.speed),
        limit: m.limit ?? DEFAULTS.speedLimit,
        lat: loc.lat,
        lng: loc.lng,
        timestamp: now,
        status: 'Dispatched',
      } as Omit<Alert, 'id'>).catch(() => {});
    });
    return () => {
      u1();
      u2();
      u3();
    };
  },

  // "online" = connected to the ESP32 directly OR to Firebase (so the Chromebook route counts too)
  subscribeConnection(cb) {
    let esp = false;
    let fb = false;
    const u1 = espLink.onConnection((v) => {
      esp = v;
      cb(esp || fb);
    });
    const u2 = firebaseBackend.subscribeConnection((v) => {
      fb = v;
      cb(esp || fb);
    });
    return () => {
      u1();
      u2();
    };
  },

  subscribeAlerts(onList, onNew) {
    fbList = [];
    local = [];
    announced.clear();
    announce = (a) => onNew(a);
    emit = () => {
      const ids = new Set(fbList.map((a) => a.id));
      local = local.filter((a) => !ids.has(a.id));
      onList([...local, ...fbList].sort((a, b) => b.timestamp - a.timestamp));
    };
    const un = firebaseBackend.subscribeAlerts(
      (list) => {
        fbList = list;
        emit?.();
      },
      (a) => {
        if (announced.has(a.id)) return; // already shown the moment it arrived
        announced.add(a.id);
        onNew(a);
      },
    );
    return () => {
      un();
      emit = null;
      announce = null;
    };
  },

  async pushAlert(a) {
    await ingest(a);
  },

  async clearAlerts() {
    local = [];
    await firebaseBackend.clearAlerts();
    emit?.();
  },

  // direct link if it is up, otherwise ask the Chromebook bridge (through Firebase) to forward it
  zeroAttitude() {
    if (!espLink.send('zero')) firebaseBackend.sendZero().catch(() => {});
  },
};
