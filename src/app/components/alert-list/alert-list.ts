import { Component, inject, input, signal } from '@angular/core';
import { PriceAlert, PriceAlertService } from '../../api-client';
import { RouteUrl } from '../../shared/route-url';
import { createPagedList } from '../../shared/paged-list.util';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Pagination } from '../pagination/pagination';
import { ToastService } from '../../services/toast-service';
import { ApiErrorResponse } from '../../shared/api-error-response';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [TranslatePipe, DecimalPipe, DatePipe, Pagination, ConfirmDialog, ReactiveFormsModule],
  selector: 'app-alert-list',
  styleUrl: './alert-list.css',
  templateUrl: './alert-list.html',
})
export class AlertList {
  private readonly priceAlertService = inject(PriceAlertService);
  private readonly toastService = inject(ToastService);

  public readonly searchTerm = input<string>('');
  public readonly sortValue = input<string>('product.name,asc');

  private readonly list = createPagedList<PriceAlert>({
    searchTerm: this.searchTerm,
    sortValue: this.sortValue,
    fallbackRoute: `/${RouteUrl.MY_ALERTS}`,
    fetchPage: (page, size, sort, search) =>
      this.priceAlertService.getAlerts(page, size, sort, search),
  });

  protected readonly priceAlerts = this.list.items;
  protected readonly loading = this.list.loading;
  protected readonly error = this.list.error;
  protected readonly totalPages = this.list.totalPages;
  protected readonly currentPage = this.list.currentPage;

  protected readonly expandedIds = signal<Set<string>>(new Set());
  protected readonly togglingIds = signal<Set<string>>(new Set());
  protected readonly alertPendingDeletion = signal<PriceAlert | null>(null);
  protected readonly isDeleting = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly isSavingPrice = signal(false);
  protected readonly priceEditError = signal<boolean>(false);

  protected readonly targetPriceControl = new FormControl<string>('', {
    nonNullable: true,
  });

  protected goToPage(page: number): void {
    this.list.goToPage(page);
  }

  protected get pageNumbers(): any {
    return this.list.pageNumbers();
  }

  protected toggleExpanded(publicId: string): void {
    if (!publicId) {
      return;
    }

    this.expandedIds.update((set) => this.toggleSetMember(set, publicId));
  }

  protected isExpanded(publicId: string): boolean {
    return !!publicId && this.expandedIds().has(publicId);
  }

  protected isToggling(publicId: string): boolean {
    return !!publicId && this.togglingIds().has(publicId);
  }

  protected onToggleStatus(event: Event, alert: PriceAlert): void {
    event.stopPropagation();

    const publicId = alert.publicId;
    if (!publicId || this.isToggling(publicId)) {
      return;
    }

    const previousStatus = alert.active;

    this.updateAlertField(publicId, { active: !previousStatus });
    this.togglingIds.update((set) => this.setMember(set, publicId, true));

    this.priceAlertService.updatePriceAlert(publicId, { active: !previousStatus }).subscribe({
      next: (updated) => {
        this.updateAlertField(publicId, { active: updated.active ?? !previousStatus });
        this.togglingIds.update((set) => this.setMember(set, publicId, false));
      },
      error: (err) => {
        this.updateAlertField(publicId, { active: previousStatus });
        this.togglingIds.update((set) => this.setMember(set, publicId, false));
        this.showApiError('ERRORS.UNABLE_TO_UPDATE_PRICE_ALERT', err);
      },
    });
  }

  protected onDeleteClick(event: Event, alert: PriceAlert): void {
    event.stopPropagation();
    this.alertPendingDeletion.set(alert);
  }

  protected onCancelDelete(): void {
    if (this.isDeleting()) {
      return;
    }

    this.alertPendingDeletion.set(null);
  }

  protected onConfirmDelete(): void {
    const publicId = this.alertPendingDeletion()!.publicId!;
    this.isDeleting.set(true);

    this.priceAlertService.deletePriceAlert(publicId).subscribe({
      next: () => {
        this.list.items.update((alerts) => alerts.filter((a) => a.publicId !== publicId));
        this.isDeleting.set(false);
        this.alertPendingDeletion.set(null);
        this.toastService.showSuccess('PRICE_ALERT_REMOVED');
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.showApiError('ERRORS.UNABLE_TO_REMOVE_PRICE_ALERT', err);
      },
    });
  }

  protected onEditPriceClick(event: Event, alert: PriceAlert): void {
    event.stopPropagation();
    this.priceEditError.set(false);
    this.editingId.set(alert.publicId!);
    const validators = [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)];

    if (alert.product?.currentPrice !== undefined) {
      validators.push(Validators.max(alert.product.currentPrice));
    }

    this.targetPriceControl.setValidators(validators);
    this.targetPriceControl.setValue((alert.targetPrice ?? 0).toFixed(2));
    this.targetPriceControl.markAsUntouched();
    this.targetPriceControl.updateValueAndValidity();
  }

  protected onCancelEditPrice(event: Event): void {
    event.stopPropagation();
    this.editingId.set(null);
  }

  protected onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/[^0-9.,]/g, '').replace(/,/g, '.');

    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    input.value = sanitized;
    this.targetPriceControl.setValue(sanitized, { emitEvent: false });
  }

  protected onSaveTargetPrice(event: Event, alert: PriceAlert): void {
    event.stopPropagation();

    if (this.targetPriceControl.invalid) {
      this.targetPriceControl.markAsTouched();
      this.priceEditError.set(true);
      return;
    }

    const publicId = alert.publicId!;
    const newPrice = parseFloat(this.targetPriceControl.value);
    this.isSavingPrice.set(true);

    this.priceAlertService.updatePriceAlert(publicId, { targetPrice: newPrice }).subscribe({
      next: (updated) => {
        this.updateAlertField(publicId, { targetPrice: updated.targetPrice ?? newPrice });
        this.isSavingPrice.set(false);
        this.editingId.set(null);
      },
      error: (err) => {
        this.isSavingPrice.set(false);
        this.showApiError('ALERT.UNABLE_TO_UPDATE_PRICE_ALERT', err);
      },
    });
  }

  protected isEditing(publicId: string): boolean {
    return !!publicId && this.editingId() === publicId;
  }

  private updateAlertField(publicId: string, changes: Partial<PriceAlert>): void {
    this.list.items.update((alerts) =>
      alerts.map((a) => (a.publicId === publicId ? { ...a, ...changes } : a)),
    );
  }

  private toggleSetMember(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }

  private setMember(set: Set<string>, id: string, present: boolean): Set<string> {
    const next = new Set(set);
    present ? next.add(id) : next.delete(id);
    return next;
  }

  private showApiError(fallbackKey: string, err: HttpErrorResponse): void {
    const apiError = err.error as ApiErrorResponse;
    this.toastService.showError(fallbackKey, apiError?.code);
  }
}
