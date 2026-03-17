import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Añade headers anti-caché a peticiones /api/* para evitar respuestas cacheadas en staging/producción.
 * En local el proxy no cachea, pero en Netlify/CDN las respuestas pueden cachearse.
 */
export const apiNoCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const url = typeof req.url === 'string' ? req.url : req.url;
  if (url.includes('/api/')) {
    const cloned = req.clone({
      setHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    return next(cloned);
  }
  return next(req);
};
