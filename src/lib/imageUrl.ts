import { env } from '@/config';

/** A picture URL from the server: full links are used as they are; a bare file name lives under `<server>/images/`. */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `${env.serverUrl}/images/${url.replace(/^\/+/, '')}`;
}
