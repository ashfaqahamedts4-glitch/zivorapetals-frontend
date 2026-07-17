import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerAuthService } from './customer-auth.service';
import { map, take } from 'rxjs/operators';

export const customerAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(CustomerAuthService);
  const router = inject(Router);

  return authService.isLoggedIn$.pipe(
    take(1),
    map((isLoggedIn) => {
      if (isLoggedIn) {
        return true;
      }
      return router.createUrlTree(['/customer/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};
