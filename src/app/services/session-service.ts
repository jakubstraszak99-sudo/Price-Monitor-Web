import { inject, Service, signal } from '@angular/core';
import { AuthenticationService } from '../api-client';
import { Router } from '@angular/router';
import { RouteUrl } from '../shared/route-url';

@Service()
export class SessionService {
  private authApi = inject(AuthenticationService);
  private router = inject(Router);

  public isLoggedIn = signal(false);
  public username = signal('');

  constructor() {
    this.checkActiveSession();
  }

  public checkActiveSession(): void {
    this.authApi.refreshToken().subscribe({
      next: () => {
        this.isLoggedIn.set(true);
        // TODO: profile
        this.username.set('Temp');
      },
      error: () => {
        this.isLoggedIn.set(false);
        this.username.set('');
      },
    });
  }

  public setLogin(): void {
    this.isLoggedIn.set(true);
    this.checkActiveSession();
  }

  public logout(): void {
    this.authApi.logout().subscribe({
      next: () => this.handleLogout(),
      error: () => this.handleLogout(),
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
