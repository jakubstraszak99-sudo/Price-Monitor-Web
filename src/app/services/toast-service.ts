import { inject, Service, signal } from '@angular/core';
import { ToastState, ToastType } from '../shared/toast-state';
import { TranslateService } from '@ngx-translate/core';

@Service()
export class ToastService {
  private translateService = inject(TranslateService);
  private timeoutId: any;

  public state = signal<ToastState>({ message: '', type: 'success', visible: false });

  public showSuccess(key: string): void {
    this.translateService.get(key).subscribe((message: string) => {
      this.show(message, 'success');
    });
  }

  public showError(key: string, code?: string): void {
    this.translateService.get(key).subscribe((message: string) => {
      this.show(message, 'error', code);
    });
  }

  private show(message: string, type: ToastType, code?: string): void {
    this.state.set({ message, type, visible: true, code });

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.state.update((s) => ({ ...s, visible: false }));
    }, 3000);
  }
}
