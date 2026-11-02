import { getApp, getApps, initializeApp } from 'firebase/app';
import { Database, getDatabase, limitToLast, onValue, orderByChild, push, query, ref, remove, set, update } from 'firebase/database';
import { DEFAULTS, VEHICLE } from '../config';
import { DB_PATH, firebaseConfig } from '../config/firebase.config';
import { Alert, Telemetry } from '../types';
import { getLastLocation } from './locationService';
import { Backend } from './types';

// Created on first use so demo mode never touches Firebase.
let _db: Database | null = null;
const db = (): Database => {
  if (!_db) _db = getDatabase(getApps().length ? getApp() : initializeApp(firebaseConfig));
  return _db;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// The ESP32 only has to send { speed, timestamp }. Anything missing is filled in here.
// The ESP32 has no GPS, so a missing location is taken from this phone.
function normalize(id: string, v: any): Alert {
  const loc = getLastLocation();
  return {
    id,
    plate: typeof v.plate === 'string' && v.plate ? v.plate : VEHICLE.plate,
    speed: num(v.speed),
    limit: v.limit != null ? num(v.limit) : DEFAULTS.speedLimit,
    lat: v.lat != null ? num(v.lat) : loc.lat,
    lng: v.lng != null ? num(v.lng) : loc.lng,
    timestamp: typeof v.timestamp === 'number' ? v.timestamp : Date.now(),
    status: v.status ?? 'Dispatched',
  } as Alert;
}

type FirebaseBackend = Backend & {
  sendZero(): Promise<void>; // asks the Chromebook bridge to send "zero" to the ESP32
  newAlertId(): string; // makes a new alert id on this phone (no network needed)
  saveAlert(id: string, data: Omit<Alert, 'id'>): Promise<void>;
};

export const firebaseBackend: FirebaseBackend = {
  mode: 'firebase',

  // Telemetry stream (ESP32 overwrites telemetry/car1 a few times a second).
  subscribeTelemetry(cb) {
    return onValue(ref(db(), DB_PATH.telemetry), (snap) => {
      const v = snap.val();
      if (!v) return;
      const t: Telemetry = { speed: num(v.speed), pitch: num(v.pitch), roll: num(v.roll), yaw: num(v.yaw) };
      cb(t);
    });
  },

  // Alerts are separate events under /alerts. onList: newest first. onNew: once per alert that appears after the first load.
  subscribeAlerts(onList, onNew) {
    const seen = new Set<string>();
    let first = true;
    const q = query(ref(db(), DB_PATH.alerts), orderByChild('timestamp'), limitToLast(100));
    return onValue(q, (snap) => {
      const list: Alert[] = [];
      const noLocation = new Set<string>();
      snap.forEach((child) => {
        const v = child.val() || {};
        if (v.lat == null || v.lng == null) noLocation.add(child.key as string);
        list.push(normalize(child.key as string, v));
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      const fresh = list.filter((a) => !seen.has(a.id)).reverse(); // oldest first
      list.forEach((a) => seen.add(a.id));
      onList(list);
      if (!first) {
        fresh.forEach((a) => {
          // save this phone's location onto the alert, so the position stays correct later
          if (noLocation.has(a.id)) {
            update(ref(db(), `${DB_PATH.alerts}/${a.id}`), { lat: a.lat, lng: a.lng }).catch(() => {});
          }
          onNew(a);
        });
      }
      first = false;
    });
  },

  // true while this phone has a live connection to Firebase
  subscribeConnection(cb) {
    return onValue(ref(db(), '.info/connected'), (snap) => cb(snap.val() === true));
  },

  async sendZero() {
    await set(ref(db(), 'control/zero'), Date.now());
  },

  newAlertId() {
    return push(ref(db(), DB_PATH.alerts)).key as string;
  },

  async saveAlert(id, data) {
    await set(ref(db(), `${DB_PATH.alerts}/${id}`), JSON.parse(JSON.stringify(data)));
  },

  async pushAlert(a) {
    await push(ref(db(), DB_PATH.alerts), JSON.parse(JSON.stringify(a)));
  },

  async clearAlerts() {
    await remove(ref(db(), DB_PATH.alerts));
  },
};
