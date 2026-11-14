const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

/** Replaces one colour in an exported SVG, so a single Figma icon can follow a status colour. Case-insensitive. */
export function tintSvg(xml: string, from: string, to: string): string {
  const escaped = from.replace(REGEX_SPECIALS, '\\$&');
  return xml.replace(new RegExp(escaped, 'gi'), to);
}
