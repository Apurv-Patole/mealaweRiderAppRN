/** Rider profile model and normalizer (pure, no React Native imports). */
export interface RiderCluster {
  clusterId?: string;
  clusterName?: string;
  allowed: boolean;
}

export interface RiderProfile {
  riderId: string;
  phoneNo: string;
  name: string;
  routeNo: string | null;
  clusters: RiderCluster[];
  isActive: boolean;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
}

/**
 * Maps the server's rider payload onto `RiderProfile`. The server has used both
 * `routeNo` / `clusters` and the older `delivery_route_no` / `cluster_allowed`
 * names, so both are accepted. Returns null if there is no usable id.
 */
export function normalizeRiderProfile(raw: unknown, fallbackPhone = ''): RiderProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const riderId = asString(record._id ?? record.riderId ?? record.id);
  if (!riderId) return null;

  const rawClusters = Array.isArray(record.clusters)
    ? record.clusters
    : Array.isArray(record.cluster_allowed)
      ? record.cluster_allowed
      : [];

  const clusters: RiderCluster[] = rawClusters
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      clusterId: typeof c.clusterId === 'string' ? c.clusterId : undefined,
      clusterName: typeof c.clusterName === 'string' ? c.clusterName : undefined,
      allowed: true,
    }));

  const routeNo = record.routeNo ?? record.delivery_route_no;

  return {
    riderId,
    phoneNo: asString(record.phoneNo) || fallbackPhone,
    name: asString(record.name),
    routeNo: routeNo === null || routeNo === undefined || routeNo === '' ? null : asString(routeNo),
    clusters,
    isActive: record.isActive !== false,
  };
}
