import { inject, Service } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

@Service()
export class LanguageService {
  private translateService = inject(TranslateService);

  public initLanguage(): void {
    const language = localStorage.getItem(environment.languageToken) ?? 'pl';
    this.translateService.setFallbackLang('pl');
    this.translateService.use(language);
  }

  public setLanguage(language: string): void {
    localStorage.setItem(environment.languageToken, language);
    this.translateService.use(language);
  }
}
