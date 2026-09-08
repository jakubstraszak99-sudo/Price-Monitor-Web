import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Product, ProductService } from '../../api-client';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RouteUrl } from '../../shared/route-url';

@Component({
  imports: [TranslatePipe, FormsModule],
  selector: 'app-product-list',
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public readonly searchTerm = input<string>('');
  public readonly sortValue = input<string>('name,asc');

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly pageSize = 20;
  protected readonly maxVisiblePages = 7;

  protected readonly currentPage = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const raw = Number(params.get('page') ?? 1);
        return Number.isFinite(raw) && raw >= 1 ? raw - 1 : 0;
      }),
    ),
    { initialValue: 0 },
  );

  constructor() {
    effect(() => {
      this.currentPage();
      this.searchTerm();
      this.sortValue();
      untracked(() => this.loadProducts());
    });
  }

  protected goToPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page === 0 ? null : page + 1 },
      queryParamsHandling: 'merge',
    });
  }

  protected get pageNumbers(): (number | '...')[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= this.maxVisiblePages) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const siblingCount = 1;
    const leftSibling = Math.max(current - siblingCount, 0);
    const rightSibling = Math.min(current + siblingCount, total - 1);
    const showLeftEllipsis = leftSibling > 1;
    const showRightEllipsis = rightSibling < total - 2;
    const pages: (number | '...')[] = [];

    pages.push(0);

    if (showLeftEllipsis) {
      pages.push('...');
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 0 && i !== total - 1) {
        pages.push(i);
      }
    }

    if (showRightEllipsis) {
      pages.push('...');
    }

    pages.push(total - 1);
    return pages;
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(false);

    const requestedPage = this.currentPage();

    this.productService
      .getProducts(requestedPage, this.pageSize, [this.sortValue()], this.searchTerm() || undefined)
      .subscribe({
        next: (page) => {
          const totalPages = page.totalPages ?? 0;

          if (totalPages > 0 && requestedPage >= totalPages) {
            this.router.navigate([`/${RouteUrl.HOME}`]);
            return;
          }

          this.products.set(page.content ?? []);
          this.totalPages.set(page.totalPages ?? 0);
          this.totalElements.set(page.totalElements ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
