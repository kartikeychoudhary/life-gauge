import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayout } from './layout/components/main-layout/main-layout';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth-module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./modules/dashboard/dashboard-module').then((m) => m.DashboardModule),
      },
      {
        path: 'health-tests',
        loadChildren: () =>
          import('./modules/health-tests/health-tests-module').then((m) => m.HealthTestsModule),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./modules/settings/settings-module').then((m) => m.SettingsModule),
      },
      {
        path: 'app-settings',
        canActivate: [AdminGuard],
        loadChildren: () =>
          import('./modules/app-settings/app-settings-module').then((m) => m.AppSettingsModule),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
