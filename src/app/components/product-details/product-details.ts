import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';
import {
  CreatePriceAlertRequest,
  PriceAlertService,
  PriceHistory,
  PriceHistoryService,
  Product,
} from '../../api-client';
import { SessionService } from '../../services/session-service';
import { ModalService } from '../../services/modal-service';
import { ToastService } from '../../services/toast-service';
import { ApiErrorResponse } from '../../shared/api-error-response';

const SPARKLINE_WIDTH = 280;
const SPARKLINE_HEIGHT = 64;

@Component({
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, Modal],
  selector: 'app-product-details',
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private readonly priceAlertService = inject(PriceAlertService);
  private readonly priceHistoryService = inject(PriceHistoryService);
  private readonly toastService = inject(ToastService);
  private readonly modalService = inject(ModalService);
  protected readonly sessionService = inject(SessionService);

  public readonly product = input.required<Product>();

  protected readonly historyLoading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly alertAlreadyExists = signal(false);
  protected readonly alertCreated = signal(false);
  protected readonly priceHistory = signal<PriceHistory[]>([]);

  protected readonly targetPriceControl = new FormControl<string>('', {
    nonNullable: true,
  });

  private readonly sortedHistory = computed(() =>
    [...this.priceHistory()].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    }),
  );

  protected readonly lowestPrice = computed(() => {
    const prices = this.sortedHistory().map((h) => h.recordedPrice ?? 0);
    return prices.length ? Math.min(...prices) : null;
  });

  protected readonly highestPrice = computed(() => {
    const prices = this.sortedHistory().map((h) => h.recordedPrice ?? 0);
    return prices.length ? Math.max(...prices) : null;
  });

  protected readonly sparklinePath = computed(() => {
    const history = this.sortedHistory();
    if (history.length < 2) {
      return null;
    }

    const prices = history.map((h) => h.recordedPrice ?? 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const stepX = SPARKLINE_WIDTH / (prices.length - 1);

    const points = prices.map((price, index) => {
      const x = index * stepX;
      const y = SPARKLINE_HEIGHT - ((price - min) / range) * SPARKLINE_HEIGHT;
      return { x, y, price };
    });

    return `M${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`;
  });

  protected readonly sparklineAreaPath = computed(() => {
    const line = this.sparklinePath();
    return line ? `${line} L${SPARKLINE_WIDTH},${SPARKLINE_HEIGHT} L0,${SPARKLINE_HEIGHT} Z` : null;
  });

  protected readonly sparklinePoints = computed(() => {
    const history = this.sortedHistory();
    if (history.length < 2) {
      return [];
    }

    const prices = history.map((h) => h.recordedPrice ?? 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const stepX = SPARKLINE_WIDTH / (prices.length - 1);

    return history.map((h, index) => ({
      x: index * stepX,
      y: SPARKLINE_HEIGHT - (((h.recordedPrice ?? 0) - min) / range) * SPARKLINE_HEIGHT,
      price: h.recordedPrice ?? 0,
      createdAt: h.createdAt,
    }));
  });

  protected readonly hoveredPoint = signal<{
    x: number;
    y: number;
    price: number;
    createdAt?: string;
  } | null>(null);

  constructor() {
    effect(() => {
      const product = this.product();
      untracked(() => {
        this.setupTargetPriceValidators(product.currentPrice!);
        this.loadPriceHistory(product.productUrl!);
        this.priceAlertService.checkAlertExists(product.productUrl!).subscribe((value) => {
          if (value) {
            this.alertAlreadyExists.set(true);
          }
        });
      });
    });
  }

  protected onPriceInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    let sanitized = inputEl.value.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    const parts = sanitized.split('.');

    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    inputEl.value = sanitized;
    this.targetPriceControl.setValue(sanitized, { emitEvent: false });
  }

  protected onSparklineHover(point: {
    x: number;
    y: number;
    price: number;
    createdAt?: string;
  }): void {
    this.hoveredPoint.set(point);
  }

  protected onSparklineLeave(): void {
    this.hoveredPoint.set(null);
  }

  protected addAlert(): void {
    if (this.targetPriceControl.invalid) {
      this.targetPriceControl.markAsTouched();
      return;
    }

    this.submitting.set(true);
    const product = this.product();
    const request: CreatePriceAlertRequest = {
      url: product.productUrl!,
      targetPrice: parseFloat(this.targetPriceControl.value),
      scrapedProduct: {
        name: product.name,
        price: product.currentPrice,
        imageUrl: product.imageUrl,
        currency: product.currency,
        shop: product.shop,
        faviconUrl: product.faviconUrl,
      },
    };

    this.priceAlertService.createAlert(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.alertCreated.set(true);
        this.toastService.showSuccess('TOASTS.PRICE_ALERT_CREATED');
      },
      error: (err) => {
        const apiError = err?.error as ApiErrorResponse | undefined;
        this.submitting.set(false);

        if (apiError?.code === 'E014') {
          this.alertAlreadyExists.set(true);
        } else {
          this.toastService.showError('ERRORS.PRICE_ALERT_NOT_CREATED', apiError?.code);
        }
      },
    });
  }

  protected close(): void {
    this.modalService.closeProductDetails();
  }

  protected promptLogin(): void {
    this.modalService.requireLogin();
  }

  private setupTargetPriceValidators(currentPrice: number): void {
    const validators = [
      Validators.required,
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
      Validators.max(currentPrice),
    ];
    this.targetPriceControl.setValidators(validators);
  }

  private loadPriceHistory(productUrl: string): void {
    this.historyLoading.set(true);

    this.priceHistoryService.getPriceHistory(productUrl).subscribe({
      next: (history) => {
        this.historyLoading.set(false);
        this.priceHistory.set(Array.isArray(history) ? history : []);
      },
      error: () => {
        this.historyLoading.set(false);
        this.priceHistory.set([]);
      },
    });
  }
}
