import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { SessionService } from '../../services/session-service';
import { ModalService } from '../../services/modal-service';
import { RouteUrl } from '../../shared/route-url';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly languageService = inject(LanguageService);
  protected readonly sessionService = inject(SessionService);
  protected readonly modalService = inject(ModalService);

  protected readonly isDropdownOpen = signal(false);
  protected readonly homeRouterLink = `/${RouteUrl.HOME}`;
  protected readonly alertsRouterLink = `/${RouteUrl.MY_ALERTS}`;

  protected switchLanguage(language: string): void {
    this.languageService.setLanguage(language);
  }

  protected toggleDropdown(): void {
    this.isDropdownOpen.update((val) => !val);
  }

  @HostListener('document:click', ['$event'])
  public onClickOutside(event: Event): void {
    if (this.isDropdownOpen()) {
      const clickedInside = (event.target as HTMLElement).closest('.dropdown-wrapper');

      if (!clickedInside) {
        this.isDropdownOpen.set(false);
      }
    }
  }
}
