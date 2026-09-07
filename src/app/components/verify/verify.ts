import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../api-client';
import { ToastService } from '../../services/toast-service';
import { RouteUrl } from '../../shared/route-url';
import { ApiErrorResponse } from '../../shared/api-error-response';
import { SessionService } from '../../services/session-service';

@Component({
  imports: [],
  selector: 'app-verify',
  templateUrl: './verify.html',
})
export class Verify implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthenticationService);
  private toastService = inject(ToastService);
  private sessionService = inject(SessionService);

  public ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.router.navigate([`/${RouteUrl.HOME}`]);
      return;
    }

    this.authService.verify(token).subscribe({
      next: () => {
        this.sessionService.setLogin();
        this.toastService.showSuccess('TOASTS.VERIFY_SUCCESS');
        this.router.navigate([`/${RouteUrl.HOME}`]);
      },
      error: (err) => {
        const apiError = err.error as ApiErrorResponse;
        this.toastService.showError('TOASTS.VERIFY_FAILED', apiError?.code);
        this.router.navigate([`/${RouteUrl.HOME}`]);
      },
    });
  }
}
