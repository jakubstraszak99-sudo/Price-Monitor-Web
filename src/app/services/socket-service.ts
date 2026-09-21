import { Service } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { Notification } from '../api-client';
import { environment } from '../../environments/environment';

const NOTIFICATION_DESTINATION = '/user/queue/notifications';
const RECONNECT_DELAY_MS = 5000;

@Service()
export class SocketService {
  private client: Client | null = null;

  public readonly notificationReceived = new Subject<Notification>();

  public connect(): void {
    if (this.client?.active) {
      return;
    }

    const brokerURL = `${environment.apiUrl.replace(/^http/, 'ws')}/ws`;

    this.client = new Client({
      brokerURL,
      reconnectDelay: RECONNECT_DELAY_MS,
      onConnect: () => {
        this.client?.subscribe(NOTIFICATION_DESTINATION, (message: IMessage) => {
          this.handleMessage(message);
        });
      },
    });

    this.client.activate();
  }

  public disconnect(): void {
    this.client?.deactivate();
    this.client = null;
  }

  private handleMessage(message: IMessage): void {
    try {
      const notification: Notification = JSON.parse(message.body);
      this.notificationReceived.next(notification);
    } catch {}
  }
}
