import { Component, HostListener, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class Modal {
  public readonly close = output<void>();
  public readonly isLoading = input(false);
  public readonly loadingText = input<string>('');
  public readonly labelledBy = input<string | null>(null);

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.isLoading()) {
      this.close.emit();
    }
  }
}
