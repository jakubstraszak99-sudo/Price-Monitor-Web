import { Router } from '@angular/router';
import { SessionService } from '../services/session-service';
import { inject, Injectable } from '@angular/core';
import { RouteUrl } from '../shared/route-url';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  public canActivate(): boolean {
    if (this.sessionService.isLoggedIn()) {
      return true;
    }

    this.router.navigate([`/${RouteUrl.HOME}`], {
      queryParams: { requireLogin: true },
    });

    return false;
  }
}
