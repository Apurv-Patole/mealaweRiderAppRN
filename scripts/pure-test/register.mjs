// Lets Node's built-in test runner import the app's pure TypeScript modules the way the app does
// (extensionless relative imports). Used only by `npm run test:pure`.
import { register } from 'node:module';

register('./resolve-ts.mjs', import.meta.url);
