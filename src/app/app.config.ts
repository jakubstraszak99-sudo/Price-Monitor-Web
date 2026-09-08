import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { BASE_PATH } from './api-client';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { SessionService } from './services/session-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService(),
    provideAppInitializer(() => {
      const sessionService = inject(SessionService);
      return sessionService.initializeSession();
    }),
    provideTranslateHttpLoader({
      prefix: './assets/langs/',
      suffix: '.json',
    }),
    { provide: BASE_PATH, useValue: environment.apiUrl },
  ],
};
