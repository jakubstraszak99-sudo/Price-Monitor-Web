import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService } from '../../api-client';
import { Modal } from '../modal/modal';
import { ModalService } from '../../services/modal-service';
import { ToastService } from '../../services/toast-service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, Modal],
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);

  protected readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email } = this.forgotPasswordForm.getRawValue();

    this.userService.forgotPassword({ email }).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.showError('ERRORS.FORGOT_PASSWORD_FAILED');
      },
    });
  }

  protected backToLogin(): void {
    this.modalService.isForgotPasswordModalOpen.set(false);
    this.modalService.openLogin();
  }

  protected close(): void {
    this.modalService.closeForgotPassword();
  }
}
