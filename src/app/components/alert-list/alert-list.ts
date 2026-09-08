import { Component, inject, input, signal } from '@angular/core';
import { PriceAlert, PriceAlertService } from '../../api-client';
import { RouteUrl } from '../../shared/route-url';
import { createPagedList } from '../../shared/paged-list.util';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Pagination } from '../pagination/pagination';

@Component({
  imports: [TranslatePipe, DecimalPipe, DatePipe, Pagination],
  selector: 'app-alert-list',
  styleUrl: './alert-list.css',
  templateUrl: './alert-list.html',
})
export class AlertList {
  private readonly priceAlertService = inject(PriceAlertService);

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

  protected goToPage(page: number): void {
    this.list.goToPage(page);
  }

  protected get pageNumbers() {
    return this.list.pageNumbers();
  }

  protected toggleExpanded(publicId: string | undefined): void {
    if (!publicId) {
      return;
    }
    this.expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(publicId)) {
        next.delete(publicId);
      } else {
        next.add(publicId);
      }
      return next;
    });
  }

  protected isExpanded(publicId: string | undefined): boolean {
    return !!publicId && this.expandedIds().has(publicId);
  }
}
