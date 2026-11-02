// STEP: paste your values from  Firebase console -> Project settings (gear icon) -> General -> Your apps -> SDK setup.
// Keep the quotes. Leave 'PASTE_...' as it is and the app runs in demo mode instead.
export const firebaseConfig = {
  apiKey: 'AIzaSyDpAL1CB8XNFbvZC5lQjsVftORd8ItaDIE',
  authDomain: 'svms-68506.firebaseapp.com',
  // Copy this one from the Realtime Database page (the address shown at the top). Singapore ends in .asia-southeast1.firebasedatabase.app
  databaseURL: 'https://svms-68506-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'svms-68506',
  appId: '1:138163901375:web:54ea227a46f6b2f616470a',
};

// Where things live in the database. The ESP32 and the laptop viewer use the same telemetry path.
export const DB_PATH = {
  telemetry: 'telemetry/car1', // ESP32 writes here: speed, pitch, roll, yaw, seq
  alerts: 'alerts',            // the app writes violations here
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some((v) => v.includes('PASTE_'));

// Set to true to run on built-in test data even when Firebase is configured.
export const FORCE_DEMO = false;
