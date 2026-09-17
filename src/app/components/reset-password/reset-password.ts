import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../api-client';
import { ToastService } from '../../services/toast-service';
import { ModalService } from '../../services/modal-service';
import { RouteUrl } from '../../shared/route-url';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RouterLink],
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly modalService = inject(ModalService);

  private resetToken: string | null = null;

  protected readonly loading = signal(false);
  protected readonly tokenMissing = signal(false);

  protected readonly resetPasswordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      repeatPassword: ['', Validators.required],
    },
    { validators: this.passwordsMatchValidator },
  );

  public ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParamMap.get('token');

    if (!this.resetToken) {
      this.tokenMissing.set(true);
    }
  }

  protected onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.resetToken) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { newPassword } = this.resetPasswordForm.getRawValue();

    this.userService.resetPassword({ resetToken: this.resetToken, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.showSuccess('TOASTS.RESET_PASSWORD_SUCCESS');
        this.router.navigate([`/${RouteUrl.HOME}`]).then(() => this.modalService.openLogin());
      },
      error: () => {
        this.loading.set(false);
        this.toastService.showError('ERRORS.RESET_PASSWORD_FAILED');
      },
    });
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const repeatPassword = control.get('repeatPassword')?.value;
    return password === repeatPassword ? null : { mismatch: true };
  }
}
