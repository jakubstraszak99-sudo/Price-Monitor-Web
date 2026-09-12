import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';

@Component({
  imports: [TranslatePipe, Modal],
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.css',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  public readonly title = input.required<string>();
  public readonly message = input.required<string>();
  public readonly isLoading = input(false);

  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();
}
