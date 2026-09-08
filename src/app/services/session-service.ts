import { inject, Service, signal } from '@angular/core';
import { AuthenticationService, UserService } from '../api-client';
import { Router } from '@angular/router';
import { RouteUrl } from '../shared/route-url';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';

@Service()
export class SessionService {
  private readonly authApi = inject(AuthenticationService);
  private readonly userApi = inject(UserService);
  private readonly router = inject(Router);

  public readonly isLoggedIn = signal(false);
  public readonly username = signal('');

  public setLogin(): void {
    this.initializeSession().subscribe();
  }

  public logout(): void {
    this.authApi.logout().subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout(),
    });
  }

  public initializeSession(): Observable<any> {
    return this.authApi.refreshToken().pipe(
      switchMap(() => this.userApi.getUser()),
      tap((user) => {
        this.isLoggedIn.set(true);
        if (user.username != null) {
          this.username.set(user.username);
        }
      }),
      catchError(() => {
        this.isLoggedIn.set(false);
        this.username.set('');
        return of(null);
      }),
    );
  }

  private handleLogout(): void {
    this.isLoggedIn.set(false);
    this.username.set('');
    this.router.navigate([`/${RouteUrl.HOME}`]).then(() => {
      window.location.reload();
    });
  }
}
