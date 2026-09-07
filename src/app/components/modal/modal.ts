import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class Modal {
  public close = output<void>();
  public isLoading = input(false);
  public loadingText = input<string>('');
}
