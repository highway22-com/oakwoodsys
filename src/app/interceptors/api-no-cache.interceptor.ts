import { HttpInterceptorFn } from '@angular/common/http';


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
