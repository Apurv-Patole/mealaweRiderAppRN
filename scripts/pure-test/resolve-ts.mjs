import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HAS_EXTENSION = /\.[cm]?[jt]sx?$/;
const SRC_ROOT = fileURLToPath(new URL('../../src/', import.meta.url));

/** Maps `@/foo/bar` to `src/foo/bar.ts` or `src/foo/bar/index.ts` (the tsconfig alias). */
function resolveAlias(specifier) {
  const rest = specifier.slice(2);
  const candidates = HAS_EXTENSION.test(rest) ? [rest] : [`${rest}.ts`, `${rest}/index.ts`];
  for (const candidate of candidates) {
    const path = `${SRC_ROOT}${candidate}`;
    if (existsSync(path)) return pathToFileURL(path).href;
  }
  return null;
}

// Lets Node's built-in test runner import the app's pure TypeScript modules the way the app
// does (extensionless relative imports and the `@/` alias). Used only by `npm test`.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const url = resolveAlias(specifier);
    if (url) return { url, shortCircuit: true };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && !HAS_EXTENSION.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
}
