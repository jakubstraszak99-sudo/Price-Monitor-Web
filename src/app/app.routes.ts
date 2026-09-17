import { Routes } from '@angular/router';
import { RouteUrl } from './shared/route-url';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: RouteUrl.HOME,
    pathMatch: 'full',
  },
  {
    path: RouteUrl.HOME,
    loadComponent: () => import('./components/home/home').then((m) => m.Home),
  },
  {
    path: RouteUrl.VERIFY,
    loadComponent: () => import('./components/verify/verify').then((m) => m.Verify),
  },
  {
    path: RouteUrl.RESET_PASSWORD,
    loadComponent: () => import('./components/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: RouteUrl.MY_ALERTS,
    loadComponent: () => import('./components/my-alerts/my-alerts').then((m) => m.MyAlerts),
    canActivate: [AuthGuard],
  },
];
