import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService, UserRegisterRequest } from '../../api-client';
import { ToastService } from '../../services/toast-service';
import { ModalService } from '../../services/modal-service';
import { Modal } from '../modal/modal';
import { passwordsMatch } from '../../utils/form-validators.util';
import { ApiErrorResponse } from '../../shared/api-error-response';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, Modal],
  selector: 'app-register',
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  private readonly toastService = inject(ToastService);
  private readonly modalService = inject(ModalService);

  protected readonly loading = signal(false);
  protected readonly error = signal(false);

  protected readonly registerForm = this.fb.nonNullable.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repeatPassword: ['', Validators.required],
    },
    { validators: passwordsMatch('password') },
  );

  protected onSubmit(): void {
    if (this.loading()) {
      return;
    }
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { repeatPassword, ...formValues } = this.registerForm.getRawValue();
    const request: UserRegisterRequest = formValues;

    this.authService.register(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.close();
        this.toastService.showSuccess('TOASTS.REGISTER_SUCCESS');
      },
      error: (err) => {
        const apiError = err.error as ApiErrorResponse;

        if (apiError?.code === 'E007') {
          this.error.set(true);
        } else {
          this.close();
          this.toastService.showError('ERRORS.REGISTER_ERROR', apiError?.code);
        }

        this.loading.set(false);
      },
    });
  }

  protected close(): void {
    this.modalService.closeRegister();
  }
}
