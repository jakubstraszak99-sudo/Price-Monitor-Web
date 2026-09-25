import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';
import {
  CreatePriceAlertRequest,
  PriceAlertService,
  PriceHistory,
  PriceHistoryService,
  Product,
} from '../../api-client';
import { targetPriceValidators } from '../../utils/form-validators.util';
import { updatePriceInput } from '../../utils/price-input.util';
import { SessionService } from '../../services/session-service';
import { ModalService } from '../../services/modal-service';
import { ToastService } from '../../services/toast-service';
import { Subscription } from 'rxjs';
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
    const points = this.sparklinePoints();
    return points.length
      ? `M${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`
      : null;
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
    effect((onCleanup) => {
      const product = this.product();
      const loggedIn = this.sessionService.isLoggedIn();
      const requests = new Subscription();
      onCleanup(() => requests.unsubscribe());

      untracked(() => {
        this.alertAlreadyExists.set(false);
        this.alertCreated.set(false);
        this.hoveredPoint.set(null);
        this.priceHistory.set([]);
        this.targetPriceControl.reset('');
        this.setupTargetPriceValidators(product.currentPrice);
        if (!product.productUrl) {
          this.historyLoading.set(false);
          return;
        }
        requests.add(this.loadPriceHistory(product.productUrl));
        if (loggedIn) {
          requests.add(
            this.priceAlertService.checkAlertExists(product.productUrl).subscribe({
              next: (value) => this.alertAlreadyExists.set(value),
              error: () => this.alertAlreadyExists.set(false),
            }),
          );
        }
      });
    });
  }

  protected onPriceInput(event: Event): void {
    updatePriceInput(event, this.targetPriceControl);
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
    if (this.submitting() || this.alertCreated() || this.alertAlreadyExists()) {
      return;
    }
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

  private setupTargetPriceValidators(currentPrice?: number): void {
    this.targetPriceControl.setValidators(targetPriceValidators(currentPrice));
    this.targetPriceControl.updateValueAndValidity();
  }

  private loadPriceHistory(productUrl: string): Subscription {
    this.historyLoading.set(true);

    return this.priceHistoryService.getPriceHistory(productUrl).subscribe({
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
