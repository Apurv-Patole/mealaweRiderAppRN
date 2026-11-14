/** True if `installed` is strictly below `required`, compared per numeric segment ("1.9.10" < "1.10.1"). */
export function isVersionBelow(installed: string, required: string): boolean {
  const a = installed.split('.').map(Number);
  const b = required.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai !== bi) return ai < bi;
  }
  return false;
}
