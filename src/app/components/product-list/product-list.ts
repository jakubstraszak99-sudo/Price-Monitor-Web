import { Component, inject, input } from '@angular/core';
import { Product, ProductService } from '../../api-client';
import { TranslatePipe } from '@ngx-translate/core';
import { RouteUrl } from '../../shared/route-url';
import { DecimalPipe } from '@angular/common';
import { createPagedList } from '../../utils/paged-list.util';
import { Pagination } from '../pagination/pagination';
import { ModalService } from '../../services/modal-service';

@Component({
  imports: [TranslatePipe, DecimalPipe, Pagination],
  selector: 'app-product-list',
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly productService = inject(ProductService);
  protected readonly modalService = inject(ModalService);

  public readonly searchTerm = input<string>('');
  public readonly sortValue = input<string>('lastUpdated,desc');

  private readonly list = createPagedList<Product>({
    searchTerm: this.searchTerm,
    sortValue: this.sortValue,
    fallbackRoute: `/${RouteUrl.HOME}`,
    fetchPage: (page, size, sort, search) =>
      this.productService.getProducts(page, size, sort, search),
  });

  protected readonly products = this.list.items;
  protected readonly loading = this.list.loading;
  protected readonly error = this.list.error;
  protected readonly totalPages = this.list.totalPages;
  protected readonly currentPage = this.list.currentPage;

  protected goToPage(page: number): void {
    this.list.goToPage(page);
  }

  protected get pageNumbers(): any {
    return this.list.pageNumbers();
  }
}
