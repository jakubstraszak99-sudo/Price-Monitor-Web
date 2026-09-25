import { HttpInterceptorFn, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { CsrfService } from './services/csrf.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.url, window.location.origin);
  const api = new URL(environment.apiUrl, window.location.origin);
  if (url.origin !== api.origin || !url.pathname.startsWith('/api/v1/')) {
    return next(req);
  }

  const authReq = req.clone({ withCredentials: true });
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next(authReq);
  }

  const tokens = inject(HttpXsrfTokenExtractor);
  const send = () => {
    const token = tokens.getToken();
    if (!token) {
      return throwError(() => new Error('CSRF cookie is unavailable'));
    }
    return next(authReq.clone({ setHeaders: { 'X-XSRF-TOKEN': token } }));
  };

  // Also supports the absolute backend URL used by the generated API client.
  return tokens.getToken() ? send() : inject(CsrfService).initialize().pipe(switchMap(send));
};
