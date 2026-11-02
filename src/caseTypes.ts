export type CaseStatus = 'new' | 'responding' | 'completed';
export type TrackPoint = { t: number; lat: number; lng: number };

// One record per acknowledged alert. Same shape we will store under alerts/{id} in Firebase later.
export type CaseRecord = {
  alertId: string;
  status: 'responding' | 'completed';
  ackAt: number;
  lastCheckin: number;
  completedAt?: number;
  track: TrackPoint[];
};
