import { Alert, Telemetry } from '../types';

export type Unsubscribe = () => void;

// Every backend (Firebase or demo) implements this. The UI only talks to this interface.
export interface Backend {
  mode: 'firebase' | 'demo';
  subscribeTelemetry(cb: (t: Telemetry) => void): Unsubscribe;
  // onList: full list (newest first). onNew: called once for each alert that arrives after the first load.
  subscribeAlerts(onList: (list: Alert[]) => void, onNew: (a: Alert) => void): Unsubscribe;
  subscribeConnection(cb: (online: boolean) => void): Unsubscribe;
  pushAlert(a: Omit<Alert, 'id'>): Promise<void>;
  clearAlerts(): Promise<void>;
  demo?: { setTargetSpeed(n: number): void };
}
