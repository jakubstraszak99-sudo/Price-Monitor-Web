import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Notification, NotificationService } from '../../api-client';
import { ModalService } from '../../services/modal-service';
import { SocketService } from '../../services/socket-service';

const DROPDOWN_PAGE_SIZE = 10;
const MAX_DROPDOWN_ITEMS = 20;

@Component({
  selector: 'app-notification-dropdown',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './notification-dropdown.html',
  styleUrl: './notification-dropdown.css',
})
export class NotificationDropdown {
  private readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);
  private readonly modalService = inject(ModalService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isOpen = signal(false);
  protected readonly loading = signal(false);
  protected readonly unreadCount = signal(0);
  protected readonly notifications = signal<Notification[]>([]);

  constructor() {
    this.refreshUnreadCount();

    this.socketService.notificationReceived
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => this.onNotificationReceived(notification));
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

  protected onDeleteClick(event: Event, notification: Notification): void {
    event.stopPropagation();

    this.notificationService.deleteNotification(notification.publicId).subscribe(() => {
      this.notifications.update((list) => list.filter((n) => n.publicId !== notification.publicId));

      if (!notification.read) {
        this.unreadCount.update((count) => Math.max(0, count - 1));
      }
    });
  }

  protected deleteAll(event: Event): void {
    event.stopPropagation();

    if (this.notifications().length === 0) {
      return;
    }

    this.notificationService.deleteNotification().subscribe(() => {
      this.notifications.set([]);
      this.unreadCount.set(0);
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  private onNotificationReceived(notification: Notification): void {
    this.unreadCount.update((count) => count + 1);
    this.notifications.update((list) => [notification, ...list].slice(0, MAX_DROPDOWN_ITEMS));
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
