/**
 * URL pública del sitio (fallback cuando no hay `location` en SSR/prerender).
 * Netlify staging: opcional `SITE_PUBLIC_URL` (sin barra final).
 */
export const SITE_PUBLIC_FALLBACK = 'https://oakwoodsys.com';

export function serverSitePublicUrl(): string {
  const fromEnv =
    typeof process !== 'undefined'
      ? process.env?.['SITE_PUBLIC_URL']?.trim().replace(/\/$/, '')
      : '';
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv;
  return SITE_PUBLIC_FALLBACK;
}
