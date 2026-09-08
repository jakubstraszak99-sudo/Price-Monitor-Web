import { Component, inject, output, signal } from '@angular/core';
import {
  CreatePriceAlertRequest,
  PriceAlertService,
  ProductService,
  ScrapedProduct,
} from '../../api-client';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';
import { ToastService } from '../../services/toast-service';
import { SessionService } from '../../services/session-service';
import { ApiErrorResponse } from '../../shared/api-error-response';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, Modal],
  selector: 'app-add-product',
  templateUrl: './add-product.html',
})
export class AddProduct {
  private readonly productService = inject(ProductService);
  private readonly priceAlertService = inject(PriceAlertService);
  private readonly toastService = inject(ToastService);
  private searchedUrl: string = '';

  protected readonly sessionService = inject(SessionService);
  protected readonly closeModal = output<void>();
  protected readonly requireLogin = output<void>();
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly scrapedProduct = signal<ScrapedProduct | null>(null);

  protected readonly urlControl = new FormControl('', {
    validators: [Validators.required, Validators.pattern(/^https?:\/\/.+/)],
    nonNullable: true,
  });

  protected readonly targetPriceControl = new FormControl<string>('0.01', {
    validators: [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)],
    nonNullable: true,
  });

  protected onSearch(): void {
    if (this.urlControl.invalid) {
      this.urlControl.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(false);
    this.searchedUrl = this.urlControl.value;

    this.productService.extractProductInfo({ url: this.searchedUrl }).subscribe({
      next: (product: ScrapedProduct) => {
        this.scrapedProduct.set(product);

        if (product.price !== undefined && product.price >= 0.01) {
          this.targetPriceControl.addValidators(Validators.max(product.price));
          this.targetPriceControl.updateValueAndValidity();
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/[^0-9.,]/g, '');
    sanitized = sanitized.replace(/,/g, '.');
    const parts = sanitized.split('.');

    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    input.value = sanitized;
    this.targetPriceControl.setValue(sanitized, { emitEvent: false });
  }

  protected confirmTracking(): void {
    const product = this.scrapedProduct();

    if (!product) {
      return;
    }

    if (this.targetPriceControl.invalid) {
      this.targetPriceControl.markAsTouched();
      return;
    }

    this.loading.set(true);
    const request: CreatePriceAlertRequest = {
      url: this.searchedUrl,
      targetPrice: parseFloat(this.targetPriceControl.value),
      scrapedProduct: product,
    };

    this.priceAlertService.createAlert(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.close();
        this.toastService.showSuccess('TOASTS.PRICE_ALERT_CREATED');
      },
      error: (err) => {
        const apiError = err.error as ApiErrorResponse;
        this.loading.set(false);
        this.close();
        this.toastService.showError('ERRORS.PRICE_ALERT_NOT_CREATRED', apiError?.code);
      },
    });
  }

  protected promptLogin(): void {
    this.requireLogin.emit();
  }

  protected close(): void {
    this.closeModal.emit();
  }
}
