import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReporteComponent } from './reporte/reporte.component';
import { AsesorComponent } from './asesor/asesor.component';
import { LandingComponent } from './landing/landing.component';
import { configLoadedGuard } from './guards/config-loaded.guard';

const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  {
    path: 'reporte-general',
    component: ReporteComponent,
    pathMatch: 'full',
    canActivate: [configLoadedGuard]
  },
  {
    path: 'reporte-asesor',
    component: AsesorComponent,
    canActivate: [configLoadedGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
