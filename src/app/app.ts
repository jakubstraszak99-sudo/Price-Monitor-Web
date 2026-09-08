import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './components/toast/toast';
import { LanguageService } from './services/language.service';

@Component({
  imports: [RouterOutlet, Toast],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly languageService = inject(LanguageService);

  public ngOnInit(): void {
    this.languageService.initLanguage();
  }
}
