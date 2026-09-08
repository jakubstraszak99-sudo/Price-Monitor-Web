import { Component, signal } from '@angular/core';
import { ProductList } from '../product-list/product-list';
import { SearchSortToolbar } from '../search-sort-toolbar/search-sort-toolbar';

@Component({
  imports: [ProductList, SearchSortToolbar],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  protected searchTerm = signal('');
  protected sortValue = signal('name,asc');

  protected readonly sortOptions: SortOption[] = [
    { labelKey: 'SORT.NAME_ASC', value: 'name,asc' },
    { labelKey: 'SORT.NAME_DESC', value: 'name,desc' },
    { labelKey: 'SORT.PRICE_ASC', value: 'currentPrice,asc' },
    { labelKey: 'SORT.PRICE_DESC', value: 'currentPrice,desc' },
    { labelKey: 'SORT.DOMAIN_NAME_ASC', value: 'domain,asc' },
    { labelKey: 'SORT.DOMAIN_NAME_DESC', value: 'domain,desc' },
    { labelKey: 'SORT.LAST_UPDATED', value: 'lastUpdated,desc' },
  ];
}
