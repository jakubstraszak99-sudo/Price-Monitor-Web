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
  protected sortValue = signal('lastUpdated,desc');

  protected readonly sortOptions: SortOption[] = [
    { labelKey: 'SORT.LAST_UPDATED', value: 'lastUpdated,desc' },
    { labelKey: 'SORT.NAME_ASC', value: 'name,asc' },
    { labelKey: 'SORT.NAME_DESC', value: 'name,desc' },
    { labelKey: 'SORT.PRICE_ASC', value: 'currentPrice,asc' },
    { labelKey: 'SORT.PRICE_DESC', value: 'currentPrice,desc' },
    { labelKey: 'SORT.SHOP_NAME_ASC', value: 'shop,asc' },
    { labelKey: 'SORT.SHOP_NAME_DESC', value: 'shop,desc' },
  ];
}
