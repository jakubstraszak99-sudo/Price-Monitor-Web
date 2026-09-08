import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { ProductList } from '../product-list/product-list';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [Navbar, ProductList, TranslatePipe, FormsModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly searchTerm = signal('');
  protected readonly sortValue = signal('name,asc');

  protected readonly sortOptions: SortOption[] = [
    { labelKey: 'SORT.NAME_ASC', value: 'name,asc' },
    { labelKey: 'SORT.NAME_DESC', value: 'name,desc' },
    { labelKey: 'SORT.PRICE_ASC', value: 'currentPrice,asc' },
    { labelKey: 'SORT.PRICE_DESC', value: 'currentPrice,desc' },
    { labelKey: 'SORT.LAST_UPDATED', value: 'lastUpdated,desc' },
  ];

  constructor() {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => this.searchTerm.set(term));
  }

  protected onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  protected onSortChange(value: string): void {
    this.sortValue.set(value);
  }
}
