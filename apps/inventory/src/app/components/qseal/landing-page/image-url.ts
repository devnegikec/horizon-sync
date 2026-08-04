import { environment } from '../../../environments/environment';

/**
 * Resolve a landing page image URL for display.
 * Backend stores relative paths like `/static/landing-pages/...`.
 * This prepends the core service base URL so images render correctly.
 *
 * @param url - Relative or absolute image URL (or null)
 * @returns Full URL ready for `<img src>` or null
 *
 * @example
 *   resolveImageUrl('/static/landing-pages/org-id/prod-id/logo_xxx.png')
 *   // → 'https://core-service.up.railway.app/static/landing-pages/org-id/prod-id/logo_xxx.png'
 */
export function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  // Already a full URL (starts with http/https) — return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path — prepend core service base URL
  return `${environment.apiCoreUrl}${url}`;
}
