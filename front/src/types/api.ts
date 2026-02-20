/* ─── Centralized API types — mirrors backend DTOs exactly ─── */

// ─── Causes ───

export interface Cause {
  id: number;
  name: string;
  description: string | null;
  affectTrs: boolean;
  isActive: boolean;
}

// ─── Stops ───

export interface Stop {
  id: number;
  jour: string; // YYYY-MM-DD
  debut: string; // HH:mm:ss
  fin: string | null; // HH:mm:ss
  duree: number | null; // seconds
  equipe: number;
  causeId: number;
  cause: Cause;
}

// ─── Analytics ───

export type DailyStopsRow = {
  day: string; // YYYY-MM-DD
  totalDowntimeSeconds: number;
  trsDowntimeSeconds: number;
  totalWorkSeconds: number;
  trs: number; // percentage
  stopsCount: number;
};

// ─── Métrage ───

export type MetrageDailyPoint = {
  day: string; // YYYY-MM-DD
  totalMeters: number;
};

export type MetrageEntry = {
  id: number;
  recordedAt: string; // ISO datetime
  meters: number;
  note: string | null;
};

export type MetrageTotalResponse = {
  from: string | null;
  to: string | null;
  totalMeters: number;
};

// ─── Vitesse ───

export type VitesseDailyPoint = {
  day: string; // YYYY-MM-DD
  avgSpeed: number;
  maxSpeed: number;
  samples: number;
};

export type VitesseSummary = {
  from: string | null;
  to: string | null;
  avgSpeed: number;
  maxSpeed: number;
  samples: number;
};

export type VitesseEntry = {
  id: number;
  recordedAt: string; // ISO datetime
  speed: number;
  note: string | null;
};

// ─── Generic paged response ───

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
