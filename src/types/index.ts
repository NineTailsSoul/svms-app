export type Telemetry = {
  speed: number; // km/h (potentiometer on the ESP32)
  pitch: number; // degrees (MPU6050)
  roll: number;
  yaw: number;
};

export type AlertStatus = 'Dispatched' | 'Acknowledged';

export type Alert = {
  id: string;
  plate: string;
  speed: number;
  limit: number;
  lat: number;
  lng: number;
  timestamp: number; // ms since epoch
  status: AlertStatus;
};

export type Phase = 'normal' | 'warning' | 'breach';
export type LinkState = 'live' | 'waiting' | 'offline' | 'demo';
