import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { interval, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Notification, NotificationService } from '../../api-client';
import { ModalService } from '../../services/modal-service';

const POLL_INTERVAL_MS = 60_000;
const DROPDOWN_PAGE_SIZE = 10;

@Component({
  selector: 'app-notification-dropdown',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './notification-dropdown.html',
  styleUrl: './notification-dropdown.css',
})
export class NotificationDropdown {
  private readonly notificationService = inject(NotificationService);
  private readonly modalService = inject(ModalService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isOpen = signal(false);
  protected readonly loading = signal(false);
  protected readonly unreadCount = signal(0);
  protected readonly notifications = signal<Notification[]>([]);

  constructor() {
    // Keep the badge fresh even while the dropdown is closed.
    interval(POLL_INTERVAL_MS)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUnreadCount());
  }

  protected toggle(): void {
    this.isOpen.update((open) => !open);

    if (this.isOpen()) {
      this.loadNotifications();
    }
  }

  protected onNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.publicId).subscribe(() => {
        this.notifications.update((list) =>
          list.map((n) => (n.publicId === notification.publicId ? { ...n, read: true } : n)),
        );
        this.unreadCount.update((count) => Math.max(0, count - 1));
      });
    }

    if (notification.product) {
      this.modalService.openProductDetails(notification.product);
    }

    this.isOpen.set(false);
  }

  protected markAllAsRead(event: Event): void {
    event.stopPropagation();

    if (this.unreadCount() === 0) {
      return;
    }

    this.notificationService.markAsRead().subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  private loadNotifications(): void {
    this.loading.set(true);

    this.notificationService.getNotifications(0, DROPDOWN_PAGE_SIZE, ['createdAt,desc']).subscribe({
      next: (page) => {
        this.notifications.set(page.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.set([]);
        this.loading.set(false);
      },
    });
  }

  private refreshUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => {},
    });
  }
}
