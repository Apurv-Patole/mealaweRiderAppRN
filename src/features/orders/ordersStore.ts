import { create } from 'zustand';

import type { RiderProfile } from '@/features/auth';

import { toggleCluster, effectiveClusterIds, type ClusterSelection } from './clusterSelection';
import type { RiderOrder } from './orderModel';
import { fetchDayOrders, fetchLateOrders } from './ordersApi';

interface OrdersState {
  /** Days from today (0 is today). */
  dateOffset: number;
  clusterSelection: ClusterSelection;
  orders: RiderOrder[];
  lateOrders: RiderOrder[];
  /** ms since epoch of the last successful load, or null before the first. */
  loadedAt: number | null;
  /** True until the first load for the current date and clusters completes. */
  loading: boolean;
  /** The last refresh failed. The previously loaded orders stay on screen. */
  failed: boolean;
  setDateOffset: (offset: number) => void;
  toggleCluster: (allIds: readonly string[], id: string) => void;
  /** Loads orders for the current date and clusters. Resolves true on success. */
  refresh: (rider: RiderProfile) => Promise<boolean>;
  reset: () => void;
}

const INITIAL = {
  dateOffset: 0,
  clusterSelection: null as ClusterSelection,
  orders: [] as RiderOrder[],
  lateOrders: [] as RiderOrder[],
  loadedAt: null as number | null,
  loading: true,
  failed: false,
};

/** Each refresh gets a number; a response that is not from the latest request is discarded. */
let latestRequest = 0;

function clusterIdsOf(rider: RiderProfile): string[] {
  return rider.clusters.map((cluster) => cluster.clusterId).filter((id): id is string => !!id);
}

function dateFor(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  ...INITIAL,

  setDateOffset: (offset) => set({ dateOffset: offset, loading: true, failed: false, orders: [], lateOrders: [] }),

  toggleCluster: (allIds, id) =>
    set((state) => ({
      clusterSelection: toggleCluster(state.clusterSelection, allIds, id),
      loading: true,
      failed: false,
    })),

  refresh: async (rider) => {
    const routeNo = rider.routeNo ?? '';
    if (!routeNo) {
      set({ orders: [], lateOrders: [], loading: false, failed: false });
      return true;
    }

    const { dateOffset, clusterSelection } = get();
    const query = {
      routeNo,
      clusterIds: effectiveClusterIds(clusterSelection, clusterIdsOf(rider)),
      date: dateFor(dateOffset),
    };
    const request = ++latestRequest;

    try {
      // Late carry-over orders only exist for today.
      const [orders, lateOrders] = await Promise.all([
        fetchDayOrders(query),
        dateOffset === 0 ? fetchLateOrders(query).catch(() => [] as RiderOrder[]) : Promise.resolve([] as RiderOrder[]),
      ]);
      if (request !== latestRequest) return true;
      set({ orders, lateOrders, loadedAt: Date.now(), loading: false, failed: false });
      return true;
    } catch {
      if (request === latestRequest) set({ loading: false, failed: true });
      return false;
    }
  },

  reset: () => set(INITIAL),
}));
