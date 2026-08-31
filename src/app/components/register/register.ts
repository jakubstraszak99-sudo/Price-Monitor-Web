import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  selector: 'app-register',
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(FormBuilder);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  closeModal = output<void>();

  registerForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    repeatPassword: ['', Validators.required],
  }, { validators: this.passwordsMatchValidator });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    // TODO: Service
    setTimeout(() => {
      this.loading.set(false);
      this.close();
    }, 1000);
  }

  close() {
    this.closeModal.emit();
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const repeatPassword = control.get('repeatPassword')?.value;
    return password === repeatPassword ? null : { mismatch: true };
  }
}
