import { Service } from '@angular/core';
import { environment } from '../../environments/environment';

@Service()
export class LanguageService {
  getLanguage(): string {
    return localStorage.getItem(environment.languageToken) || 'pl';
  }

  setLanguage(language: string): void {
    localStorage.setItem(environment.languageToken, language);
  }
}
