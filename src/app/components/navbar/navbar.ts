import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  private translateService = inject(TranslateService);
  private languageService = inject(LanguageService);

  ngOnInit(): void {
    const language = this.languageService.getLanguage();
    this.translateService.use(language);
  }

  public switchLanguage(language: string): void {
    this.translateService.use(language);
    this.languageService.setLanguage(language);
  }
}
