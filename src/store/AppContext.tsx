import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import { CaseRecord } from '../caseTypes';
import { BootScreen } from '../components/BootScreen';
import { CheckinToast } from '../components/CheckinToast';
import { DEFAULTS, VEHICLE } from '../config';
import { BOOT_STEPS } from '../config/boot';
import { CASE_CHECKIN_MS } from '../config/cases';
import { PRESENTATION_MODE } from '../config/release';
import { SPEED_FROM_LATEST_ALERT } from '../config/telemetry';
import { backend } from '../services/backend';
import { Coords, getLastLocation, startLocation, stopLocation, subscribeLocation } from '../services/locationService';
import { Alert, LinkState, Phase, Telemetry } from '../types';
import { caseId } from '../utils/format';
import { synthTrace } from '../utils/trace';

type Settings = { limit: number };

type AppState = {
  telemetry: Telemetry;
  speedHistory: number[];
  alerts: Alert[];
  phase: Phase;
  countdown: number | null;
  link: LinkState;
  mode: 'firebase' | 'demo';
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  location: Coords | null;
  locationOk: boolean;
  activeAlert: Alert | null;
  openAlert: (a: Alert) => void;
  closeAlert: () => void;
  simulateAlert: () => Promise<void>;
  clearAlerts: () => Promise<void>;
  setDemoSpeed: (n: number) => void;
  // cases (acknowledge -> en route -> completed)
  cases: Record<string, CaseRecord>;
  activeCases: number;
  acknowledgeCase: (a: Alert) => void;
  completeCase: (alertId: string) => void;
  getTrace: (a: Alert) => number[];
  // start-up screen
  markBootReady: (key: string) => void;
};

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

const INITIAL: Telemetry = { speed: 0, pitch: 0, roll: 0, yaw: 0 };

// With PRESENTATION_MODE on, anything recorded before this launch is treated as sample data and hidden.
const SESSION_START = Date.now();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<Telemetry>(INITIAL);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [online, setOnline] = useState(false);
  const [deviceLive, setDeviceLive] = useState(false);
  const [phase, setPhase] = useState<Phase>('normal');
  const [location, setLocation] = useState<Coords | null>(null);
  const [locationOk, setLocationOk] = useState(false);
  const [cases, setCases] = useState<Record<string, CaseRecord>>({});
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [settings, setSettingsState] = useState<Settings>({ limit: DEFAULTS.speedLimit });

  const telemetryRef = useRef<Telemetry>(INITIAL);
  const lastTelRef = useRef(0);
  const histRef = useRef<number[]>([]);
  const traces = useRef<Record<number, number[]>>({});
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const casesRef = useRef(cases);
  casesRef.current = cases;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const markBootReady = useCallback((key: string) => setReady((p) => (p[key] ? p : { ...p, [key]: true })), []);

  // Radar / banner show "violation" for 10 seconds after an alert arrives.
  const flashBreach = useCallback(() => {
    setPhase('breach');
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    phaseTimer.current = setTimeout(() => setPhase('normal'), 10000);
  }, []);

  // Sample / old alerts are hidden in the presentation build (they are not deleted).
  const alerts = useMemo(
    () => (PRESENTATION_MODE ? allAlerts.filter((a) => a.timestamp >= SESSION_START) : allAlerts),
    [allAlerts],
  );

  // Writes an alert to the backend (used by Simulate and by demo mode; in Firebase mode the ESP32 sends the real ones).
  const createAlert = useCallback(async (speed: number, limit: number, simulated = false) => {
    const loc = getLastLocation();
    const ts = Date.now();
    const recent = histRef.current.slice(-48);
    traces.current[ts] =
      !simulated && recent.length >= 10
        ? [...recent.slice(0, -1), Math.round(speed)]
        : synthTrace(ts, Math.round(speed), limit);
    await backend.pushAlert({
      plate: VEHICLE.plate,
      speed: Math.round(speed),
      limit,
      lat: loc.lat,
      lng: loc.lng,
      timestamp: ts,
      status: 'Dispatched',
    });
  }, []);

  // Data subscriptions (all backend access goes through services/backend)
  useEffect(() => {
    const u1 = backend.subscribeTelemetry((t) => {
      telemetryRef.current = t;
      lastTelRef.current = Date.now();
      setTelemetry(t);
      histRef.current = [...histRef.current.slice(-59), t.speed];
      setSpeedHistory(histRef.current);
    });
    const u2 = backend.subscribeAlerts(
      (list) => setAllAlerts(list),
      (a) => {
        if (PRESENTATION_MODE && a.timestamp < SESSION_START) return;
        Vibration.vibrate([0, 400, 150, 400]);
        flashBreach();
        setActiveAlert(a);
      },
    );
    const u3 = backend.subscribeConnection(setOnline);
    const u4 = subscribeLocation(setLocation);
    startLocation().then((ok) => {
      setLocationOk(ok);
      markBootReady('location');
    });
    const live = setInterval(() => setDeviceLive(Date.now() - lastTelRef.current < 5000), 1000);
    const core = setTimeout(() => markBootReady('core'), 500);
    return () => {
      u1();
      u2();
      u3();
      u4();
      stopLocation();
      clearInterval(live);
      clearTimeout(core);
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    };
  }, [markBootReady, flashBreach]);

  useEffect(() => {
    if (backend.mode === 'demo' || online) markBootReady('cloud');
  }, [online, markBootReady]);

  // DEMO MODE ONLY: no ESP32 here, so the app itself raises an alert the moment the test speed goes over the limit.
  // (In Firebase mode alerts come only from the ESP32.)
  useEffect(() => {
    if (backend.mode !== 'demo') return;
    let over = false;
    const id = setInterval(() => {
      const { speed } = telemetryRef.current;
      const { limit } = settingsRef.current;
      if (speed > limit && !over) {
        over = true;
        createAlert(speed, limit);
      } else if (speed <= limit) {
        over = false;
      }
    }, 250);
    return () => clearInterval(id);
  }, [createAlert]);

  // Open cases: log this phone's location + time and notify the officer every CASE_CHECKIN_MS.
  const activeCases = useMemo(() => Object.values(cases).filter((c) => c.status === 'responding').length, [cases]);
  useEffect(() => {
    if (!activeCases) return;
    const id = setInterval(() => {
      const now = Date.now();
      const due = Object.values(casesRef.current).filter(
        (c) => c.status === 'responding' && now - c.lastCheckin >= CASE_CHECKIN_MS,
      );
      if (!due.length) return;
      const loc = getLastLocation();
      setCases((prev) => {
        const next = { ...prev };
        for (const c of due) {
          const cur = next[c.alertId];
          if (cur && cur.status === 'responding') {
            next[c.alertId] = { ...cur, lastCheckin: now, track: [...cur.track, { t: now, lat: loc.lat, lng: loc.lng }] };
          }
        }
        return next;
      });
      Vibration.vibrate([0, 200, 100, 200]);
      setToast({
        id: now,
        text: due.length === 1 ? `Case ${caseId(due[0].alertId)} is still open` : `${due.length} cases are still open`,
      });
    }, 1000);
    return () => clearInterval(id);
  }, [activeCases]);

  const acknowledgeCase = useCallback((a: Alert) => {
    const now = Date.now();
    const loc = getLastLocation();
    setCases((prev) =>
      prev[a.id]
        ? prev
        : {
            ...prev,
            [a.id]: {
              alertId: a.id,
              status: 'responding',
              ackAt: now,
              lastCheckin: now,
              track: [{ t: now, lat: loc.lat, lng: loc.lng }],
            },
          },
    );
    setActiveAlert(null);
    Vibration.vibrate(80);
  }, []);

  const completeCase = useCallback((alertId: string) => {
    const now = Date.now();
    const loc = getLastLocation();
    setCases((prev) => {
      const c = prev[alertId];
      if (!c || c.status === 'completed') return prev;
      return {
        ...prev,
        [alertId]: { ...c, status: 'completed', completedAt: now, track: [...c.track, { t: now, lat: loc.lat, lng: loc.lng }] },
      };
    });
  }, []);

  const getTrace = useCallback((a: Alert) => traces.current[a.timestamp] ?? synthTrace(a.id, a.speed, a.limit), []);

  const setSettings = useCallback((s: Partial<Settings>) => setSettingsState((p) => ({ ...p, ...s })), []);
  const simulateAlert = useCallback(async () => {
    const limit = settingsRef.current.limit;
    await createAlert(limit + 15 + Math.floor(Math.random() * 35), limit, true);
  }, [createAlert]);
  const clearAlerts = useCallback(async () => {
    await backend.clearAlerts();
    setCases({});
  }, []);
  const setDemoSpeed = useCallback((n: number) => backend.demo?.setTargetSpeed(n), []);

  const link: LinkState =
    backend.mode === 'demo' ? 'demo' : !online ? 'offline' : deviceLive ? 'live' : 'waiting';

  // Speed shown in the app: the latest alert's speed (Firebase mode), or the live telemetry speed.
  const fromAlerts = backend.mode === 'firebase' && SPEED_FROM_LATEST_ALERT;
  const shownSpeed = fromAlerts ? (alerts[0]?.speed ?? 0) : telemetry.speed;
  const shownTelemetry = useMemo<Telemetry>(() => ({ ...telemetry, speed: shownSpeed }), [telemetry, shownSpeed]);
  const shownHistory = useMemo(
    () => (fromAlerts ? alerts.slice(0, 30).map((a) => a.speed).reverse() : speedHistory),
    [fromAlerts, alerts, speedHistory],
  );

  const value = useMemo<AppState>(
    () => ({
      telemetry: shownTelemetry,
      speedHistory: shownHistory,
      alerts,
      phase,
      countdown: null,
      link,
      mode: backend.mode,
      settings,
      setSettings,
      location,
      locationOk,
      activeAlert,
      openAlert: setActiveAlert,
      closeAlert: () => setActiveAlert(null),
      simulateAlert,
      clearAlerts,
      setDemoSpeed,
      cases,
      activeCases,
      acknowledgeCase,
      completeCase,
      getTrace,
      markBootReady,
    }),
    [shownTelemetry, shownHistory, alerts, phase, link, settings, location, locationOk, activeAlert,
      cases, activeCases, setSettings, simulateAlert, clearAlerts, setDemoSpeed, acknowledgeCase, completeCase,
      getTrace, markBootReady],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <CheckinToast toast={toast} onHide={() => setToast(null)} />
      <BootScreen steps={BOOT_STEPS} ready={ready} />
    </Ctx.Provider>
  );
}
