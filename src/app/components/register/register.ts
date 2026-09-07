import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService, UserRegisterRequest } from '../../api-client';
import { ToastService } from '../../services/toast-service';
import { Modal } from '../modal/modal';
import { ApiErrorResponse } from '../../shared/api-error-response';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, Modal],
  selector: 'app-register',
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthenticationService);
  private toastService = inject(ToastService);

  public loading = signal(false);
  public error = signal(false);
  public closeModal = output<void>();

  public registerForm = this.fb.nonNullable.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repeatPassword: ['', Validators.required],
    },
    { validators: this.passwordsMatchValidator },
  );

  public onSubmit(): void {
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

        if (apiError.code === 'E007') {
          this.error.set(true);
        }

        else {
          this.close();
          this.toastService.showError('ERRORS.REGISTER_ERROR', apiError.code);
        }

        this.loading.set(false);
      },
    });
  }

  public close(): void {
    this.closeModal.emit();
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const repeatPassword = control.get('repeatPassword')?.value;
    return password === repeatPassword ? null : { mismatch: true };
  }
}
