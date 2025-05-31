// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { ConfigComponent } from './components/config/config.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { ServicesComponent } from './components/services/services.component';
import { ServiceFlowComponent } from './components/service-flow/service-flow.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'config',
    component: ConfigComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'services',
    component: ServicesComponent,
    canActivate: [AuthGuard]
  },
  {
    // 🔧 Updated route to accept both service CODE and service ID
    // :serviceCode - for the service flow API (e.g., "01", "03", "05")
    // :serviceId - for case submission (numeric ID like 9, 46, 51)
    path: 'service-flow/:serviceCode/:serviceId',
    component: ServiceFlowComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
