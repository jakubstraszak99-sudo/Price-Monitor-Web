import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { finalize, Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Service()
export class CsrfService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private pending?: Observable<void>;

  initialize(): Observable<void> {
    return (this.pending ??= this.http
      .get<void>(`${environment.apiUrl}/api/v1/auth/csrf`, {
        withCredentials: true,
      })
      .pipe(
        finalize(() => (this.pending = undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      ));
  }
}
