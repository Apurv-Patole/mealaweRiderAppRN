/** Text for the Profile hero (pure, no React Native imports). */

/** Up to two initials of a name: "Demo Rider" gives "DR", "ravi" gives "R", an empty name gives "R". */
export function heroInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return letters || 'R';
}

/** "+91 9999900000". An empty number gives an empty string (the line is left out). */
export function heroPhone(phoneNo: string | null | undefined): string {
  const digits = (phoneNo ?? '').trim();
  return digits ? `+91 ${digits}` : '';
}

/** "Route #DEMO-1", or an empty string when the rider has no route yet. */
export function heroRoute(routeNo: string | null | undefined): string {
  const route = (routeNo ?? '').trim();
  return route ? `Route #${route}` : '';
}
