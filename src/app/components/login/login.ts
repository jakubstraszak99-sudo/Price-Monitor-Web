import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiErrorResponse } from '../../shared/api-error-response';
import { ExceptionCode } from '../../shared/exception-code';
import { AuthenticationService, UserLoginRequest } from '../../api-client';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthenticationService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  closeModal = output<void>();

  loginForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const request: UserLoginRequest = this.loginForm.getRawValue();

    this.authService.login(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.close();
      },
      error: (err) => {
        const apiError = err.error as ApiErrorResponse;
        this.errorMessage.set(apiError.message);

        if (apiError.code === ExceptionCode.E008) {
          this.loginForm.controls.password.reset();
        }
      },
    });
  }

  close() {
    this.closeModal.emit();
  }
}
