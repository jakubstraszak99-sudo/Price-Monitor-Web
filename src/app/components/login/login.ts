import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthenticationService, UserLoginRequest } from '../../api-client';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';
import { ModalService } from '../../services/modal-service';
import { SessionService } from '../../services/session-service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, Modal],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  private readonly modalService = inject(ModalService);
  private readonly sessionService = inject(SessionService);

  protected readonly loading = signal(false);
  protected readonly error = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const request: UserLoginRequest = this.loginForm.getRawValue();

    this.authService.login(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.close();
        this.sessionService.setLogin();
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
        this.loginForm.controls.password.reset();
      },
    });
  }

  protected close(): void {
    this.modalService.closeLogin();
  }

  protected openForgotPassword(): void {
    this.modalService.openForgotPassword();
  }
}
