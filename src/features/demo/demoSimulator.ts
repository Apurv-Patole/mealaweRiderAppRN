import { create } from 'zustand';

import { fetchLegRoute } from '@/features/route/directionsApi';
import { haversineMeters, type LatLng } from '@/lib/geo';

import { addDistance, nextTarget, startingPoint, type DemoTarget } from './demoState';

/**
 * A simulated rider phone. In demo mode this stands in for GPS: it parks 40 m from the first kitchen,
 * then drives to the next kitchen or customer (along the road when the routing service answers, in a
 * straight line otherwise) while the shift is online.
 */

const TICK_MS = 1_000;
/** Metres moved per tick: 25 m/s is about 90 km/h, fast enough to watch a whole run in a few minutes. */
const STEP_M = 25;
const ARRIVED_M = 12;

interface SimulatorState {
  position: LatLng | null;
  heading: number | null;
}

export const useSimulatorStore = create<SimulatorState>(() => ({ position: null, heading: null }));

let timer: ReturnType<typeof setInterval> | null = null;
let path: LatLng[] = [];
let targetKey = '';

function bearing(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) - Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function towards(from: LatLng, to: LatLng, meters: number): LatLng {
  const total = haversineMeters(from, to);
  if (total === 0) return to;
  const ratio = meters / total;
  return { lat: from.lat + (to.lat - from.lat) * ratio, lng: from.lng + (to.lng - from.lng) * ratio };
}

/** Walks `STEP_M` along the queued path and returns the new position. */
function advance(from: LatLng): { next: LatLng; moved: number } {
  let current = from;
  let remaining = STEP_M;
  while (remaining > 0 && path.length > 0) {
    const waypoint = path[0]!;
    const distance = haversineMeters(current, waypoint);
    if (distance <= remaining) {
      current = waypoint;
      remaining -= distance;
      path = path.slice(1);
    } else {
      current = towards(current, waypoint, remaining);
      remaining = 0;
    }
  }
  return { next: current, moved: STEP_M - remaining };
}

function loadRoad(from: LatLng, target: DemoTarget): void {
  fetchLegRoute(from, target.point)
    .then((route) => {
      if (route && targetKey === target.key) path = [...route.points, target.point];
    })
    .catch(() => undefined); // offline: keep driving in a straight line
}

function tick(): void {
  const { position } = useSimulatorStore.getState();
  if (!position) return;

  const target = nextTarget(position);
  if (!target) {
    path = [];
    targetKey = '';
    return;
  }
  if (target.key !== targetKey) {
    targetKey = target.key;
    path = [target.point];
    loadRoad(position, target);
  }
  if (path.length === 0) {
    if (haversineMeters(position, target.point) <= ARRIVED_M) return;
    path = [target.point];
  }
  const { next, moved } = advance(position);
  if (moved <= 0) return;
  addDistance(moved / 1000);
  useSimulatorStore.setState({ position: next, heading: bearing(position, next) });
}

export function startSimulator(): void {
  if (!useSimulatorStore.getState().position) useSimulatorStore.setState({ position: startingPoint(), heading: null });
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
}

export function stopSimulator(): void {
  if (timer) clearInterval(timer);
  timer = null;
  path = [];
  targetKey = '';
  useSimulatorStore.setState({ position: null, heading: null });
}

/** The simulated phone's position right now (parked at the start if the simulator has not run yet). */
export function simulatedPosition(): LatLng {
  return useSimulatorStore.getState().position ?? startingPoint();
}
