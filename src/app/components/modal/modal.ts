import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class Modal {
  public readonly close = output<void>();
  public readonly isLoading = input(false);
  public readonly loadingText = input<string>('');
}
