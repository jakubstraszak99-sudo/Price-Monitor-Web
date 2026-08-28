import { Routes } from '@angular/router';
import { RouteUrl } from './shared/route-url';

export const routes: Routes = [
  {
    path: '',
    redirectTo: RouteUrl.HOME,
    pathMatch: 'full'
  },
  {
    path: RouteUrl.HOME,
    loadComponent: () => import('./components/home/home').then(m => m.Home)
  },
  {
    path: RouteUrl.LOGIN,
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  }
];
