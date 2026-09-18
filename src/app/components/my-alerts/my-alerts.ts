import { Component, signal } from '@angular/core';
import { SearchSortToolbar } from '../search-sort-toolbar/search-sort-toolbar';
import { AlertList } from '../alert-list/alert-list';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [SearchSortToolbar, AlertList, TranslatePipe],
  selector: 'app-my-alerts',
  templateUrl: './my-alerts.html',
})
export class MyAlerts {
  protected searchTerm = signal('');
  protected sortValue = signal('createdAt,desc');

  protected readonly sortOptions: SortOption[] = [
    { labelKey: 'SORT.CREATED_NEWEST', value: 'createdAt,desc' },
    { labelKey: 'SORT.CREATED_OLDEST', value: 'createdAt,asc' },
    { labelKey: 'SORT.NAME_ASC', value: 'product.name,asc' },
    { labelKey: 'SORT.NAME_DESC', value: 'product.name,desc' },
    { labelKey: 'SORT.PRICE_ASC', value: 'product.currentPrice,asc' },
    { labelKey: 'SORT.PRICE_DESC', value: 'product.currentPrice,desc' },
    { labelKey: 'SORT.ACTIVE_FIRST', value: 'active,desc' },
    { labelKey: 'SORT.INACTIVE_FIRST', value: 'active,asc' },
  ];
}
