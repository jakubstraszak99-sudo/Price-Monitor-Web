import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthenticationService, UserLoginRequest } from '../../api-client';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, Modal],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthenticationService);

  public loading = signal(false);
  public error = signal(false);
  public closeModal = output<void>();
  public loginSuccess = output<void>();

  public loginForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const request: UserLoginRequest = this.loginForm.getRawValue();

    this.authService.login(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.loginSuccess.emit();
        this.close();
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
        this.loginForm.controls.password.reset();
      },
    });
  }

  public close(): void {
    this.closeModal.emit();
  }
}
