import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-pagination',
  styleUrl: './pagination.css',
  templateUrl: './pagination.html',
})
export class Pagination {
  public readonly currentPage = input.required<number>();
  public readonly totalPages = input.required<number>();
  public readonly pageNumbers = input.required<(number | '...')[]>();
  public readonly pageChange = output<number>();

  protected onGoToPage(page: number): void {
    this.pageChange.emit(page);
  }
}
