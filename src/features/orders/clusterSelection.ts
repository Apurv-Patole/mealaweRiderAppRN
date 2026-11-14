/**
 * Which of the rider's clusters (delivery areas) are included in the orders search (pure).
 * `null` means "all of them", which is the default and what a rider sees at first.
 */
export type ClusterSelection = readonly string[] | null;

/** The cluster ids to send to the server. */
export function effectiveClusterIds(selection: ClusterSelection, allIds: readonly string[]): string[] {
  if (selection === null) return [...allIds];
  return allIds.filter((id) => selection.includes(id));
}

/**
 * Toggles one cluster. The last selected cluster cannot be switched off, because an empty
 * list would search nothing and look like "no orders". Selecting every cluster returns to `null`.
 */
export function toggleCluster(selection: ClusterSelection, allIds: readonly string[], id: string): ClusterSelection {
  if (!allIds.includes(id)) return selection;
  const current = effectiveClusterIds(selection, allIds);
  const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
  if (next.length === 0) return selection;
  return next.length === allIds.length ? null : next;
}

export function isClusterSelected(selection: ClusterSelection, id: string): boolean {
  return selection === null || selection.includes(id);
}
