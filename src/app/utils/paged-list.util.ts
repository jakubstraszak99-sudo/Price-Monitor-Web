import { effect, inject, signal, Signal, untracked } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_MAX_VISIBLE_PAGES = 7;

export interface PagedResponse<T> {
  content?: T[];
  totalPages?: number;
  totalElements?: number;
}

export interface PagedListOptions<T> {
  searchTerm: Signal<string>;
  sortValue: Signal<string>;
  fetchPage: (
    page: number,
    size: number,
    sort: string[],
    search?: string,
  ) => Observable<PagedResponse<T>>;
  fallbackRoute: string;
  pageSize?: number;
  maxVisiblePages?: number;
}

export function createPagedList<T>(options: PagedListOptions<T>) {
  const router = inject(Router);
  const route = inject(ActivatedRoute);

  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxVisiblePages = options.maxVisiblePages ?? DEFAULT_MAX_VISIBLE_PAGES;

  const reloadVersion = signal(0);
  const items = signal<T[]>([]);
  const loading = signal(true);
  const error = signal(false);
  const totalPages = signal(0);
  const totalElements = signal(0);

  const currentPage = toSignal(
    route.queryParamMap.pipe(
      map((params) => {
        const raw = Number(params.get('page') ?? 1);
        return Number.isSafeInteger(raw) && raw >= 1 ? raw - 1 : 0;
      }),
    ),
    { initialValue: 0 },
  );

  function loadItems() {
    loading.set(true);
    error.set(false);

    const requestedPage = currentPage();

    return options
      .fetchPage(requestedPage, pageSize, [options.sortValue()], options.searchTerm() || undefined)
      .subscribe({
        next: (page) => {
          const total = page.totalPages ?? 0;

          if (requestedPage > 0 && requestedPage >= total) {
            router.navigate([options.fallbackRoute], {
              queryParams: { page: null },
              queryParamsHandling: 'merge',
            });
            return;
          }

          items.set(page.content ?? []);
          totalPages.set(total);
          totalElements.set(page.totalElements ?? 0);
          loading.set(false);
        },
        error: () => {
          error.set(true);
          loading.set(false);
        },
      });
  }

  function goToPage(page: number): void {
    router.navigate([], {
      relativeTo: route,
      queryParams: { page: page === 0 ? null : page + 1 },
      queryParamsHandling: 'merge',
    });
  }

  function pageNumbers(): (number | '...')[] {
    const total = totalPages();
    const current = currentPage();

    if (total <= maxVisiblePages) {
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

  effect((onCleanup) => {
    currentPage();
    options.searchTerm();
    options.sortValue();
    reloadVersion();
    const subscription = untracked(() => loadItems());
    onCleanup(() => subscription.unsubscribe());
  });

  function reload(): void {
    reloadVersion.update((version) => version + 1);
  }

  return {
    items,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    goToPage,
    pageNumbers,
    reload,
  };
}
