// Renders the native tab-bar icons (Android needs image files; iOS uses SF Symbols)
// from the same Lucide shapes the rest of the app uses. Output: black strokes on
// transparent 72x72 PNGs, which the tab bar tints (renderingMode "template").
// Run: npm run icons
import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lucideIcons = join(root, 'node_modules', 'lucide-react-native', 'dist', 'esm', 'icons');
const outDir = join(root, 'assets', 'images', 'tabIcons');
const SIZE = 72;

// tab name -> Lucide icon file
const ICONS = {
  orders: 'package',
  route: 'map',
  wallet: 'wallet',
  profile: 'user',
};

function attrs(props) {
  return Object.entries(props)
    .filter(([key]) => key !== 'key')
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}

function toSvg(node) {
  const shapes = node.map(([tag, props]) => `<${tag} ${attrs(props)} />`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes}</svg>`
  );
}

// The icon modules import React Native, which Node cannot load, so the shape
// data is read straight from the file text (it is a plain object literal).
async function loadNodes(iconFile) {
  const source = await readFile(join(lucideIcons, `${iconFile}.mjs`), 'utf8');
  const match = source.match(/const __iconData = (\{[\s\S]*?\n\});/);
  if (!match) throw new Error(`Could not read icon data for ${iconFile}`);
  return new Function(`return (${match[1]});`)().node;
}

await mkdir(outDir, { recursive: true });

for (const [tab, iconFile] of Object.entries(ICONS)) {
  const png = await sharp(Buffer.from(toSvg(await loadNodes(iconFile)))).png().toBuffer();
  await writeFile(join(outDir, `${tab}.png`), png);
  console.log(`wrote tabIcons/${tab}.png (${iconFile})`);
}
