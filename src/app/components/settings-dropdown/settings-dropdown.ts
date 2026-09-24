import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService } from '../../api-client';
import { ModalService } from '../../services/modal-service';

@Component({
  selector: 'app-settings-dropdown',
  imports: [TranslatePipe],
  templateUrl: './settings-dropdown.html',
  styleUrl: './settings-dropdown.css',
})
export class SettingsDropdown {
  private readonly userApi = inject(UserService);
  private readonly modalService = inject(ModalService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly isOpen = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly emailAlertsEnabled = signal<boolean | null>(null);
  protected readonly error = signal<string | null>(null);

  protected toggle(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen() && !this.saving() && !this.loading()) {
      this.loadSettings();
    }
  }

  protected loadSettings(): void {
    this.loading.set(true);
    this.error.set(null);
    this.emailAlertsEnabled.set(null);
    this.userApi
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.emailAlertsEnabled.set(user.emailAlertsEnabled ?? true);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(
            err.status === 401 ? 'ERRORS.SESSION_EXPIRED' : 'ERRORS.SETTINGS_LOAD_FAILED',
          );
        },
      });
  }

  protected changeEmailPreference(event: Event): void {
    if (this.saving() || this.emailAlertsEnabled() === null) {
      return;
    }
    const previous = this.emailAlertsEnabled()!;
    const enabled = (event.target as HTMLInputElement).checked;
    this.emailAlertsEnabled.set(enabled);
    this.saving.set(true);
    this.error.set(null);

    this.userApi
      .updateSettings({ emailAlertsEnabled: enabled })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.emailAlertsEnabled.set(user.emailAlertsEnabled ?? enabled);
          this.saving.set(false);
        },
        error: (err) => {
          this.emailAlertsEnabled.set(previous);
          this.saving.set(false);
          this.error.set(
            err.status === 401 ? 'ERRORS.SESSION_EXPIRED' : 'ERRORS.SETTINGS_SAVE_FAILED',
          );
        },
      });
  }

  protected changePassword(): void {
    this.isOpen.set(false);
    this.modalService.openChangePassword();
  }

  @HostListener('document:click', ['$event'])
  protected onOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.trigger()?.nativeElement.focus();
    }
  }

  @HostListener('focusout', ['$event'])
  protected onFocusOut(event: FocusEvent): void {
    if (
      event.relatedTarget &&
      !this.elementRef.nativeElement.contains(event.relatedTarget as Node)
    ) {
      this.isOpen.set(false);
    }
  }
}
