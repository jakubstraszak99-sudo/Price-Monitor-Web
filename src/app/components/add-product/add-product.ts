import { Component, inject, signal } from '@angular/core';
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
import { ModalService } from '../../services/modal-service';
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
  private readonly modalService = inject(ModalService);
  private searchedUrl: string = '';

  protected readonly sessionService = inject(SessionService);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
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
    this.errorMessage.set(null);
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
        this.errorMessage.set('ERRORS.SCRAP_FAILED');
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
    if (this.targetPriceControl.invalid) {
      this.targetPriceControl.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const request: CreatePriceAlertRequest = {
      url: this.searchedUrl,
      targetPrice: parseFloat(this.targetPriceControl.value),
      scrapedProduct: this.scrapedProduct()!,
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

        if (apiError.code === 'E014') {
          this.errorMessage.set('ERRORS.PRICE_ALERT_ALREADY_EXISTS');
        } else {
          this.toastService.showError('ERRORS.PRICE_ALERT_NOT_CREATED', apiError?.code);
          this.close();
        }
      },
    });
  }

  protected promptLogin(): void {
    this.modalService.requireLogin();
  }

  protected close(): void {
    this.modalService.closeAddProduct();
  }
}
