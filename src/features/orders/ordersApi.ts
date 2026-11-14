import { ENDPOINTS, http } from '@/services/http';

import { dayRange } from './deliveryDate';
import { normalizeOrders, type RiderOrder } from './orderModel';

export interface OrdersQuery {
  routeNo: string;
  clusterIds: string[];
  /** The delivery day. */
  date: Date;
}

/**
 * Every order for the day on the rider's route and clusters, across all meal slots. One request
 * feeds the stats and the lists; slots are separated on the device by `mealType`.
 */
export async function fetchDayOrders(query: OrdersQuery): Promise<RiderOrder[]> {
  const { fromDate, toDate } = dayRange(query.date);
  const raw = await http.post<unknown>(ENDPOINTS.orders.search, {
    routeNo: query.routeNo,
    fromDate,
    toDate,
    clusterList: query.clusterIds,
  });
  return normalizeOrders(raw);
}

interface LateOrdersResponse {
  orders?: unknown;
}

/**
 * Orders from an earlier meal slot that are still unfinished, shown as "deliver first" so a
 * carry-over delivery never disappears when the slot rolls over. Lateness is decided by the server clock.
 */
export async function fetchLateOrders(query: OrdersQuery): Promise<RiderOrder[]> {
  const { fromDate, toDate } = dayRange(query.date);
  const response = await http.post<LateOrdersResponse>(ENDPOINTS.orders.late, {
    routeNo: query.routeNo,
    fromDate,
    toDate,
    clusterList: query.clusterIds,
  });
  return normalizeOrders(response?.orders);
}
