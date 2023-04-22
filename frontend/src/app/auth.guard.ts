import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (sessionStorage.getItem('token') && sessionStorage.getItem('user')) {
      // If the user is logged in, allow access to the route
      return true;
    } else {
      // If the user is not logged in, redirect to the home page
      this.router.navigate(['']);
      return false;
    }
  }

  canDeactivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (sessionStorage.getItem('token') && sessionStorage.getItem('user')) {
      // If the user is logged in, prevent navigation back to the home page
      return false;
    } else {
      // If the user is not logged in, allow navigation back to the home page
      return true;
    }
  }
}
