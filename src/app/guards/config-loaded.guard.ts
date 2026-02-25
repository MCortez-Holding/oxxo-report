import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';

/**
 * Guard que exige que la data primaria esté cargada (usuario haya pasado por el formulario de configuración).
 * Si no hay configuración, redirige a la landing.
 */
export const configLoadedGuard: CanActivateFn = () => {
  const config = inject(ConfigService);
  const router = inject(Router);

  if (config.hasPrimaryData()) {
    return true;
  }
  return router.createUrlTree(['/']);
};
