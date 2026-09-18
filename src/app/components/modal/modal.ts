import { Component, HostListener, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class Modal {
  public readonly close = output<void>();
  public readonly isLoading = input(false);
  public readonly loadingText = input<string>('');

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.isLoading()) {
      this.close.emit();
    }
  }
}
