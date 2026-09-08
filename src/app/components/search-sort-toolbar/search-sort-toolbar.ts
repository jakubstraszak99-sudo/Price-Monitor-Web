import { Component, DestroyRef, inject, input, model } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [TranslatePipe, FormsModule],
  selector: 'app-search-sort-toolbar',
  styleUrl: './search-sort-toolbar.css',
  templateUrl: './search-sort-toolbar.html',
})
export class SearchSortToolbar {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  public readonly sortOptions = input.required<SortOption[]>();
  public readonly searchTerm = model<string>('');
  public readonly sortValue = model<string>('');

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
