import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { Login } from '../login/login';
import { Register } from '../register/register';
import { SessionService } from '../../services/session-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, TranslatePipe, Login, Register],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);

  public sessionService = inject(SessionService);

  public isLoginModalOpen = signal(false);
  public isRegisterModalOpen = signal(false);
  public isDropdownOpen = signal(false);

  public ngOnInit(): void {
    const language = this.languageService.getLanguage();
    this.translateService.use(language);
  }

  public switchLanguage(language: string): void {
    this.translateService.use(language);
    this.languageService.setLanguage(language);
  }

  public toggleDropdown(): void {
    this.isDropdownOpen.update((val) => !val);
  }

  public onLogin(): void {
    this.isLoginModalOpen.set(false);
    this.sessionService.setLogin();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.isDropdownOpen()) {
      const clickedInside = (event.target as HTMLElement).closest('.dropdown-wrapper');

      if (!clickedInside) {
        this.isDropdownOpen.set(false);
      }
    }
  }
}
