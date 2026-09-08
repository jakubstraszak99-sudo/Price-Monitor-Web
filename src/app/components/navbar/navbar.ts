import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { Login } from '../login/login';
import { Register } from '../register/register';
import { SessionService } from '../../services/session-service';
import { AddProduct } from '../add-product/add-product';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, TranslatePipe, Login, Register, AddProduct],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly languageService = inject(LanguageService);
  protected readonly sessionService = inject(SessionService);

  protected readonly isLoginModalOpen = signal(false);
  protected readonly isRegisterModalOpen = signal(false);
  protected readonly isDropdownOpen = signal(false);
  protected readonly isAddProductModalOpen = signal(false);

  protected switchLanguage(language: string): void {
    this.languageService.setLanguage(language);
  }

  protected toggleDropdown(): void {
    this.isDropdownOpen.update((val) => !val);
  }

  protected onLogin(): void {
    this.isLoginModalOpen.set(false);
    this.sessionService.setLogin();
  }

  protected handleRequireLogin(): void {
    this.isAddProductModalOpen.set(false);
    this.isLoginModalOpen.set(true);
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
