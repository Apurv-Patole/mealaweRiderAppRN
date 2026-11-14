import { haversineMeters, isValidLatLng } from '@/lib/geo';

/**
 * Background location tracking rules (pure, no React Native imports).
 *
 * The phone reads GPS every few seconds and the app sends a ping to the server only every
 * `intervalMs`: 30 s while delivering (customers watch the rider on a map), 60 s otherwise
 * (battery). The server can change the rate in each reply (`nextPingMs`). Every ping is saved to a
 * buffer first and sent oldest-first, so a stretch without signal loses nothing and the server sees
 * the pings in time order.
 *
 * Distance feeds rider pay, so the phone also adds up the road distance between GPS fixes
 * (`segmentMeters`), ignoring poor fixes and stationary jitter, and the server validates it.
 */
export type TrackingStage = 'pickup_stage' | 'delivery_stage' | 'completed';

export interface Fix {
  lat: number;
  lng: number;
  /** Metres; null when the phone does not report it. */
  accuracy: number | null;
  /** Metres per second. */
  speed: number | null;
  /** Degrees of travel direction. */
  heading: number | null;
  /** ms since epoch, from the GPS fix itself. */
  timestamp: number;
}

export interface TrackingContext {
  riderId: string;
  shiftId: string;
  stage: TrackingStage;
}

export interface TrackingState {
  context: TrackingContext;
  /** The last fix that counted toward distance. */
  lastFix: Fix | null;
  /** Road distance since the last ping, in metres. */
  segmentMeters: number;
  /** ms since epoch of the last ping that was created, or null before the first. */
  lastPingAt: number | null;
  intervalMs: number;
}

export interface PingPayload {
  riderId: string;
  shiftId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  /** ISO timestamp of the fix. */
  timestamp: string;
  stage: TrackingStage;
  segmentMeters: number;
}

export const DELIVERY_INTERVAL_MS = 30_000;
export const DEFAULT_INTERVAL_MS = 60_000;
/** The server's `nextPingMs` is kept within this range so a bad value can neither flood nor silence tracking. */
export const MIN_INTERVAL_MS = 10_000;
export const MAX_INTERVAL_MS = 120_000;

/** Fixes less accurate than this do not count toward distance. */
export const MAX_ACCURACY_M = 50;
/** Movement smaller than this between accepted fixes is GPS jitter, not travel. */
export const MIN_MOVEMENT_M = 5;
/** Faster than this between fixes (about 200 km/h) is a GPS jump, not travel. */
export const MAX_PLAUSIBLE_MPS = 55;
/** The offline buffer keeps at most this many pings, dropping the oldest. */
export const MAX_BUFFER = 500;

export function intervalForStage(stage: TrackingStage): number {
  return stage === 'delivery_stage' ? DELIVERY_INTERVAL_MS : DEFAULT_INTERVAL_MS;
}

export function clampInterval(ms: number): number {
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, ms));
}

export function startState(context: TrackingContext): TrackingState {
  return { context, lastFix: null, segmentMeters: 0, lastPingAt: null, intervalMs: intervalForStage(context.stage) };
}

/**
 * The same tracking with a new stage (the rider started the delivery ride). The server's own rate, if it
 * sent one, is replaced by the stage default until its next reply.
 */
export function withStage(state: TrackingState, stage: TrackingStage): TrackingState {
  if (state.context.stage === stage) return state;
  return { ...state, context: { ...state.context, stage }, intervalMs: intervalForStage(stage) };
}

/** Metres to add to the distance for this fix, given the last fix that counted. */
export function segmentIncrement(previous: Fix | null, fix: Fix): number {
  if (fix.accuracy !== null && fix.accuracy > MAX_ACCURACY_M) return 0;
  if (!previous) return 0;
  const meters = haversineMeters(previous, fix);
  if (meters < MIN_MOVEMENT_M) return 0;
  const seconds = (fix.timestamp - previous.timestamp) / 1000;
  if (seconds > 0 && meters / seconds > MAX_PLAUSIBLE_MPS) return 0;
  return meters;
}

function isAccurate(fix: Fix): boolean {
  return fix.accuracy === null || fix.accuracy <= MAX_ACCURACY_M;
}

export interface FixResult {
  state: TrackingState;
  /** A ping to save and send, or null when it is not time yet. */
  ping: PingPayload | null;
}

/**
 * Handles one GPS fix. Adds its distance, and when a ping is due (the first one, or `intervalMs` since
 * the last) returns it with the distance so far and resets the distance. A fix with bad coordinates is ignored.
 */
export function onFix(state: TrackingState, fix: Fix, nowMs: number): FixResult {
  if (!isValidLatLng({ lat: fix.lat, lng: fix.lng })) return { state, ping: null };

  const added = segmentIncrement(state.lastFix, fix);
  let next: TrackingState = {
    ...state,
    segmentMeters: state.segmentMeters + added,
    // The first fix, or any accurate one, becomes the reference for the next distance.
    lastFix: isAccurate(fix) || !state.lastFix ? fix : state.lastFix,
  };

  const due = next.lastPingAt === null || nowMs - next.lastPingAt >= next.intervalMs;
  if (!due) return { state: next, ping: null };

  const ping: PingPayload = {
    riderId: next.context.riderId,
    shiftId: next.context.shiftId,
    lat: fix.lat,
    lng: fix.lng,
    accuracy: fix.accuracy,
    speed: fix.speed,
    heading: fix.heading,
    timestamp: new Date(fix.timestamp).toISOString(),
    stage: next.context.stage,
    segmentMeters: Math.round(next.segmentMeters),
  };
  next = { ...next, segmentMeters: 0, lastPingAt: nowMs };
  return { state: next, ping };
}

export interface PingReply {
  saved: boolean;
  /** The server says tracking should stop (the shift is over). */
  stop: boolean;
  nextPingMs: number | null;
}

/** Reads the server's reply to a ping. Anything unexpected means "carry on at the current rate". */
export function parsePingReply(raw: unknown): PingReply {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const next = Number(record.nextPingMs);
  return {
    saved: record.saved === true,
    stop: record.stop === true,
    nextPingMs: Number.isFinite(next) && next > 0 ? next : null,
  };
}

/** The tracking state after a reply: a valid `nextPingMs` sets the rate (within limits). */
export function applyReply(state: TrackingState, reply: PingReply): TrackingState {
  return reply.nextPingMs === null ? state : { ...state, intervalMs: clampInterval(reply.nextPingMs) };
}

// ── Offline buffer ──────────────────────────────────────────────

/** Adds a ping to the end of the buffer, dropping the oldest ones beyond the cap. */
export function enqueuePing(buffer: readonly PingPayload[], ping: PingPayload, cap = MAX_BUFFER): PingPayload[] {
  const next = [...buffer, ping];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/** Narrows stored JSON to a buffer, dropping malformed entries. */
export function parseBuffer(raw: unknown): PingPayload[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is PingPayload => {
    if (!item || typeof item !== 'object') return false;
    const record = item as Record<string, unknown>;
    return (
      typeof record.riderId === 'string' &&
      typeof record.shiftId === 'string' &&
      typeof record.lat === 'number' &&
      typeof record.lng === 'number' &&
      typeof record.timestamp === 'string'
    );
  });
}

/** Narrows stored JSON to a tracking state, or null when it is missing or malformed. */
export function parseState(raw: unknown): TrackingState | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const context = record.context as Record<string, unknown> | undefined;
  if (!context || typeof context.riderId !== 'string' || typeof context.shiftId !== 'string') return null;
  const stage = context.stage === 'delivery_stage' || context.stage === 'completed' ? context.stage : 'pickup_stage';
  const interval = Number(record.intervalMs);
  const segment = Number(record.segmentMeters);
  const lastPingAt = Number(record.lastPingAt);
  return {
    context: { riderId: context.riderId, shiftId: context.shiftId, stage },
    lastFix: (record.lastFix as Fix | null | undefined) ?? null,
    segmentMeters: Number.isFinite(segment) && segment > 0 ? segment : 0,
    lastPingAt: record.lastPingAt === null || !Number.isFinite(lastPingAt) ? null : lastPingAt,
    intervalMs: Number.isFinite(interval) ? clampInterval(interval) : intervalForStage(stage),
  };
}

/** A line for the screen: whether location is being shared, when the last ping went, and how many wait. */
export interface TrackingSummary {
  active: boolean;
  lastPingAt: number | null;
  waiting: number;
}

export function describeTracking(summary: TrackingSummary, nowMs: number): string {
  if (!summary.active) return 'Location sharing is off.';
  const waiting = summary.waiting > 0 ? ` ${summary.waiting} waiting to send.` : '';
  if (summary.lastPingAt === null) return `Location sharing is on. Waiting for the first GPS fix.${waiting}`;
  const seconds = Math.max(0, Math.round((nowMs - summary.lastPingAt) / 1000));
  const ago = seconds < 60 ? 'just now' : `${Math.round(seconds / 60)} min ago`;
  return `Location sharing is on. Last sent ${ago}.${waiting}`;
}
