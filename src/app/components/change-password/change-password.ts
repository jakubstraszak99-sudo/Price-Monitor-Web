import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService } from '../../api-client';
import { Modal } from '../modal/modal';
import { ModalService } from '../../services/modal-service';
import { ToastService } from '../../services/toast-service';
import { ExceptionCode } from '../../shared/exception-code';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, TranslatePipe, Modal],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  private readonly userApi = inject(UserService);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      oldPassword: ['', [Validators.required, Validators.pattern(/\S/)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/\S/)]],
      repeatPassword: ['', Validators.required],
    },
    {
      validators: (control: AbstractControl): ValidationErrors | null =>
        control.get('newPassword')?.value === control.get('repeatPassword')?.value
          ? null
          : { mismatch: true },
    },
  );

  constructor() {
    afterNextRender(() =>
      this.elementRef.nativeElement.querySelector<HTMLInputElement>('#current-password')?.focus(),
    );
    this.destroyRef.onDestroy(() => this.document.getElementById('settings-toggle')?.focus());
  }

  protected onSubmit(): void {
    if (this.saving()) {
      return;
    }
    this.error.set(null);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    this.userApi
      .updatePassword({ oldPassword, newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.passwordForm.reset();
          this.toastService.showSuccess('TOASTS.CHANGE_PASSWORD_SUCCESS');
          this.close();
        },
        error: (err) => {
          this.saving.set(false);
          const code = err.error?.code;
          this.error.set(
            err.status === 401
              ? 'ERRORS.SESSION_EXPIRED'
              : code === ExceptionCode.E003
                ? 'ERRORS.CURRENT_PASSWORD_INVALID'
                : code === ExceptionCode.E004
                  ? 'ERRORS.PASSWORD_UNCHANGED'
                  : 'ERRORS.CHANGE_PASSWORD_FAILED',
          );
        },
      });
  }

  protected close(): void {
    if (!this.saving()) {
      this.modalService.closeChangePassword();
    }
  }

  @HostListener('keydown.tab', ['$event'])
  protected trapFocus(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    const controls = this.elementRef.nativeElement.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled)',
    );
    const first = controls.item(0);
    const last = controls.item(controls.length - 1);
    if (keyboardEvent.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!keyboardEvent.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
