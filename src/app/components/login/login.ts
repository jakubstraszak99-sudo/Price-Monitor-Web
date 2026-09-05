import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
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

  public loading = signal(false);
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

    this.authService.login(request).subscribe(() => {
      this.loading.set(false);
      this.loginSuccess.emit();
    });
  }

  public close(): void {
    this.closeModal.emit();
  }
}
