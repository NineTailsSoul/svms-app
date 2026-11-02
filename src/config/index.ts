// All app-wide constants live here. Change plate / limits / station for the demo.
export const VEHICLE = {
  plate: 'DL 01 AB 1234',
  model: 'Test vehicle',
};

export const DEFAULTS = {
  speedLimit: 60, // km/h
  graceSeconds: 10, // time allowed to slow down after the warning
  maxSpeed: 140, // speedometer max
};

// Used when phone GPS is unavailable (New Delhi)
export const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209 };

// Realtime Database paths (the ESP32 must write to the same paths)
export const DB_PATHS = {
  telemetry: 'telemetry/car1',
  alerts: 'alerts',
};

// Fake data for the profile screen
export const STATION = {
  code: 'DL-89-NORTH',
  name: 'Civil Lines Traffic Police Station',
  zone: 'North Delhi, Zone 3',
  officer: 'Insp. Arjun Mehta',
  rank: 'Station House Officer',
  badge: 'DL-TR-4821',
  shift: '06:00 to 18:00',
  phone: '011-2345-0089',
};
