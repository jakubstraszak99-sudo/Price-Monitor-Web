import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast-service';

@Component({
  imports: [],
  selector: 'app-toast',
  styleUrl: './toast.css',
  templateUrl: './toast.html',
})
export class Toast {
  public toastService = inject(ToastService);
}
