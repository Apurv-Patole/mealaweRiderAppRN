/**
 * Dark-mode colours for the SVGs exported from Figma, which carry their light-mode colours inside the file.
 * Pure (no React Native imports) so it is unit tested. `darkenSvg` swaps each known colour for its dark twin;
 * anything not listed (white strokes on coloured tiles, the lime brand accent) is left alone on purpose.
 */

/** Light colour in an exported SVG, lower case, to the colour it becomes on a dark surface. */
export const SVG_DARK_MAP: Readonly<Record<string, string>> = {
  // brand greens (line icons on light surfaces become lighter greens)
  '#037f56': '#34c895',
  '#006442': '#4fd1a1',
  '#16834a': '#4bc98a',
  // inks
  '#171c19': '#eef3ef',
  '#181d1a': '#eef3ef',
  '#343b36': '#d6ded8',
  '#3e4942': '#c3cdc6',
  '#68716b': '#a3aea6',
  '#a7b0a9': '#7d8a81',
  // blues (demo banner, preparing pill)
  '#1a4b85': '#8ab8f0',
  '#2b64b1': '#8ab8f0',
  '#2563eb': '#7ea6f7',
  '#1d4ed8': '#8ab8f0',
  // missed-slot red and the upcoming grey
  '#b91c1c': '#f58f8f',
  '#404d46': '#b7c2ba',
  // location-off alert amber and the "You are here" green
  '#b87015': '#f0c27a',
  '#056d49': '#7fe0b8',
  // error red
  '#c43d3d': '#f08a8a',
  // destination pin body
  '#1c1f1e': '#5b7266',
};

/** Fills used by the pale proof-map background and its roads (exported as pale fills). */
export const MAP_DARK_MAP: Readonly<Record<string, string>> = {
  '#edf4f0': '#111a15',
  '#e3ede7': '#16221b',
  '#e5efe9': '#15201a',
  '#dde8e2': '#1a2a21',
  '#d8efe4': '#123024',
};

/** Colours that must stay as exported in both modes: brand lime, logo colours and the dark hero. */
export const SVG_KEEP: readonly string[] = ['#b8f52b', '#004d34', '#016937', '#075c40', '#0d2319', '#ffffff', '#fff'];

/** Road strokes on the maps are drawn in white; on a dark map they become a soft green line. */
const ROAD_WHITE_DARK = '#1f3a2d';

const HEX = /#[0-9a-fA-F]{6}\b/g;

export interface DarkenOptions {
  /** Also turn `white` strokes and fills into the road colour. Only for map backdrops. */
  roads?: boolean;
}

function swap(xml: string, from: string, to: string): string {
  return xml.replace(new RegExp(from.replace('#', '#'), 'gi'), to);
}

/** Replaces the colours in an exported SVG with their dark-mode twins. */
export function darkenSvg(xml: string, options: DarkenOptions = {}): string {
  const table = { ...SVG_DARK_MAP, ...MAP_DARK_MAP };
  let out = xml.replace(HEX, (found) => table[found.toLowerCase()] ?? found);
  if (options.roads) {
    out = swap(out, 'stroke="white"', `stroke="${ROAD_WHITE_DARK}"`);
    out = swap(out, 'fill="white"', `fill="${ROAD_WHITE_DARK}"`);
  }
  return out;
}

/** Every six-digit colour written in an SVG string, lower case and without duplicates. */
export function colorsIn(xml: string): string[] {
  return [...new Set((xml.match(HEX) ?? []).map((color) => color.toLowerCase()))];
}
