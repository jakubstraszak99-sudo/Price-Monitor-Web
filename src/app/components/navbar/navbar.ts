import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session-service';
import { ModalService } from '../../services/modal-service';
import { RouteUrl } from '../../shared/route-url';
import { NotificationDropdown } from '../notification-dropdown/notification-dropdown';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, TranslatePipe, NotificationDropdown],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly languageService = inject(LanguageService);
  protected readonly sessionService = inject(SessionService);
  protected readonly modalService = inject(ModalService);

  protected readonly homeRouterLink = `/${RouteUrl.HOME}`;
  protected readonly alertsRouterLink = `/${RouteUrl.MY_ALERTS}`;

  protected switchLanguage(language: string): void {
    this.languageService.setLanguage(language);
  }
}
