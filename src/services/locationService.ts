import * as Location from 'expo-location';
import { DEFAULT_LOCATION } from '../config';

export type Coords = { lat: number; lng: number; accuracy?: number };

let last: Coords | null = null;
let sub: Location.LocationSubscription | null = null;
const listeners = new Set<(c: Coords) => void>();

export async function startLocation(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 1 },
      (p) => {
        last = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy ?? undefined,
        };
        listeners.forEach((l) => l(last as Coords));
      },
    );
    return true;
  } catch {
    return false;
  }
}

export function stopLocation() {
  sub?.remove();
  sub = null;
}

export function getLastLocation(): Coords {
  return last ?? DEFAULT_LOCATION;
}

export function subscribeLocation(cb: (c: Coords) => void): () => void {
  listeners.add(cb);
  if (last) cb(last);
  return () => {
    listeners.delete(cb);
  };
}
