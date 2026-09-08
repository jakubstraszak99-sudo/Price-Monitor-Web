import { inject, Service, signal } from '@angular/core';
import { AuthenticationService, UserService } from '../api-client';
import { Router } from '@angular/router';
import { RouteUrl } from '../shared/route-url';
import { catchError, switchMap } from 'rxjs';

@Service()
export class SessionService {
  private readonly authApi = inject(AuthenticationService);
  private readonly userApi = inject(UserService);
  private readonly router = inject(Router);

  public readonly isLoggedIn = signal(false);
  public readonly username = signal('');

  constructor() {
    this.checkActiveSession();
  }

  public setLogin(): void {
    this.checkActiveSession();
  }

  public logout(): void {
    this.authApi.logout().subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout(),
    });
  }

  private checkActiveSession(): void {
    this.authApi
      .refreshToken()
      .pipe(
        switchMap(() => this.userApi.getUser()),
        catchError((error) => {
          throw error;
        }),
      )
      .subscribe({
        next: (user) => {
          this.isLoggedIn.set(true);
          if (user.username != null) {
            this.username.set(user.username);
          }
        },
        error: () => {
          this.isLoggedIn.set(false);
          this.username.set('');
        },
      });
  }

  private handleLogout(): void {
    this.isLoggedIn.set(false);
    this.username.set('');
    this.router.navigate([`/${RouteUrl.HOME}`]).then(() => {
      window.location.reload();
    });
  }
}
