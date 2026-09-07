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
  private languageService = inject(LanguageService);
  public sessionService = inject(SessionService);

  public isLoginModalOpen = signal(false);
  public isRegisterModalOpen = signal(false);
  public isDropdownOpen = signal(false);
  public isAddProductModalOpen = signal(false);

  public switchLanguage(language: string): void {
    this.languageService.setLanguage(language);
  }

  public toggleDropdown(): void {
    this.isDropdownOpen.update((val) => !val);
  }

  public onLogin(): void {
    this.isLoginModalOpen.set(false);
    this.sessionService.setLogin();
  }

  public handleRequireLogin(): void {
    this.isAddProductModalOpen.set(false);
    this.isLoginModalOpen.set(true);
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
