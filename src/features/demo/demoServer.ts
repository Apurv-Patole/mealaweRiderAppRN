import { HttpError } from '@/services/http/helpers';

import { buildOrder, DEMO_CUSTOMERS, demoRiderDoc } from './demoData';
import { demoPhotoUri } from './demoMedia';
import {
  currentShift,
  endShift,
  getWorld,
  setOrderStatus,
  setPickupProof,
  slotConfig,
  startRide,
  startShift,
  tickKitchens,
  type DemoShift,
} from './demoState';
import { demoLedger, demoPastIncentives, demoPastShifts, demoSalary, DEMO_BALANCE } from './demoWallet';

/**
 * The demo mode "server": answers the rider API from memory so every screen works without a backend.
 * Paths and response shapes mirror MealaweServerApp (see `src/services/http/endpoints.ts`).
 */

const LATENCY_MS = 250;
const PING_INTERVAL_MS = 30_000;

type Body = unknown;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Reads a text field from a JSON body or from a React Native FormData (which keeps its parts in `_parts`). */
function field(body: Body, name: string): string | undefined {
  const parts = (body as { _parts?: unknown })._parts;
  if (Array.isArray(parts)) {
    const hit = parts.find((part) => Array.isArray(part) && part[0] === name) as [string, unknown] | undefined;
    return typeof hit?.[1] === 'string' ? hit[1] : undefined;
  }
  const value = record(body)[name];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function shiftDoc(shift: DemoShift | null): Record<string, unknown> {
  return shift ? { ...shift } : {};
}

function ordersInRange(body: Body): unknown[] {
  const from = new Date(String(record(body).fromDate ?? 0)).getTime();
  const to = new Date(String(record(body).toDate ?? 0)).getTime();
  const { createdAt } = getWorld();
  if (Number.isFinite(from) && Number.isFinite(to) && (createdAt < from || createdAt > to)) return [];
  return tickKitchens(Date.now());
}

function historyOrders(): unknown[] {
  const now = new Date();
  const earlier = new Date(now.getTime() - 86_400_000);
  const pastDelivered = DEMO_CUSTOMERS.slice(0, 3).map((spec) => ({
    ...buildOrder(spec, 'Dinner', earlier, 'delivered'),
    _id: `demo-past-${spec.n}`,
    orderNo: `DM0${900 + spec.n}`,
    proofCapturedAt: earlier.toISOString(),
  }));
  const today = getWorld().orders.filter((order) => order.orderstatus === 'delivered');
  return [...today, ...pastDelivered];
}

function profileUpdate(body: Body): Record<string, unknown> {
  const name = field(body, 'name')?.trim();
  return demoRiderDoc(name || 'Demo Rider');
}

function pathParts(path: string): { pathname: string; query: URLSearchParams } {
  const [pathname = '', search = ''] = path.split('?');
  return { pathname, query: new URLSearchParams(search) };
}

function notFound(method: string, pathname: string): never {
  throw new HttpError(404, `Demo mode has no ${method} ${pathname}`);
}

async function route(method: string, path: string, body: Body): Promise<unknown> {
  const { pathname, query } = pathParts(path);
  const world = getWorld();

  if (pathname === '/authrider/logout') return {};
  if (pathname === '/api/getAppVersionByName' || pathname.startsWith('/api/getAppVersionByName/')) return null;
  if (pathname === '/api/saveFcmToken' || pathname === '/api/saveRiderLead') return {};

  if (pathname === '/api/rider/profile/me') return demoRiderDoc();
  if (pathname === '/api/rider/profile/update') return profileUpdate(body);
  if (pathname === '/api/slot-config/me') return slotConfig(new Date());

  if (pathname.startsWith('/api/rider/shift/today/')) return shiftDoc(currentShift());
  if (pathname.startsWith('/api/rider/shifts/today-all/')) {
    const shift = currentShift();
    return shift ? [{ mealSlot: shift.mealSlot, status: shift.status }] : [];
  }
  if (pathname === '/api/rider/shift/start') {
    const km = Number(field(body, 'startKm') ?? 0);
    return startShift(Number.isFinite(km) ? km : 0, field(body, 'routeNo') ?? 'DEMO-1', field(body, 'mealSlot') ?? world.mealType);
  }
  if (pathname === '/api/rider/shift/end') return shiftDoc(endShift());

  if (pathname === '/api/rider/searchRiderFoodOrderList') return ordersInRange(body);
  if (pathname === '/api/rider/pendingOrders') return { orders: [] };

  if (pathname === '/api/rider/location/ping') return { saved: true, stop: false, nextPingMs: PING_INTERVAL_MS };

  if (pathname.startsWith('/api/rider/pickup/proof/') || pathname.startsWith('/api/rider/delivery/proof/')) {
    return { url: demoPhotoUri() };
  }
  if (pathname === '/api/rider/pickup/complete') {
    const orderId = field(body, 'orderId');
    if (orderId) setPickupProof(orderId, field(body, 'proofUrl') ?? demoPhotoUri());
    return {};
  }
  const statusMatch = /^\/api\/rider\/order\/([^/]+)\/status$/.exec(pathname);
  if (statusMatch) return applyStatus(decodeURIComponent(statusMatch[1] ?? ''), body);
  if (pathname === '/api/rider/startDelivery') return { updated: startRide() };
  if (pathname === '/api/rider/route/start-delivery') return {};
  if (pathname === '/api/riderCancelRequest') return { ok: true };

  if (pathname === '/api/rider/wallet/me') {
    return { balance: DEMO_BALANCE };
  }
  if (pathname === '/api/rider/wallet/ledger/me') {
    const page = Math.max(1, Number(query.get('page')) || 1);
    const limit = Math.max(1, Number(query.get('limit')) || 20);
    return [...world.extraLedger, ...demoLedger()].slice((page - 1) * limit, page * limit);
  }
  if (pathname.startsWith('/api/rider/monthly-salary/me/')) {
    return demoSalary(decodeURIComponent(pathname.split('/').pop() ?? ''), new Date());
  }
  if (pathname === '/api/incentive/shift/me') return [...world.extraIncentives, ...demoPastIncentives()];

  if (pathname.startsWith('/api/rider/shift/history/')) {
    const ended = world.extraShifts.map((shift) => ({ ...shift }));
    return [...ended, ...demoPastShifts()];
  }
  if (pathname.startsWith('/api/rider/orders/history/')) return historyOrders();

  return notFound(method, pathname);
}

function applyStatus(orderId: string, body: Body): Record<string, unknown> {
  const status = field(body, 'status');
  const known = getWorld().orders.find((order) => order._id === orderId);
  if (!known) throw new HttpError(404, 'Order not found');
  if (status === 'handedOverToDeliveryBoy') return { ...(setOrderStatus(orderId, 'handedOverToDeliveryBoy') ?? {}) };
  if (status === 'onTheWay') return { ...(setOrderStatus(orderId, 'onTheWay') ?? {}) };
  if (status === 'delivered') {
    const next = setOrderStatus(orderId, 'delivered', {
      proofImageUrl: field(body, 'proofImageUrl') ?? demoPhotoUri(),
      handOverTo: field(body, 'handOverTo') ?? '',
      proofCapturedAt: new Date().toISOString(),
    });
    return { ...(next ?? {}) };
  }
  throw new HttpError(400, 'Unknown status');
}

/** Handles one rider API call in demo mode. Mirrors the HTTP client's contract: resolves JSON or throws `HttpError`. */
export async function handleDemoRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  await wait(LATENCY_MS);
  return (await route(method, path, body)) as T;
}

