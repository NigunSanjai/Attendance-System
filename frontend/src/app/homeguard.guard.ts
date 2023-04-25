import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root',
})
export class HomeGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // window.history.pushState(null, null, window.location.href);
    // window.onpopstate = function () {
    //   window.history.pushState(null, null, window.location.href);
    // };
    if (sessionStorage.getItem('notloggedin') == 'true') {
      // If the user is logged in, allow access to the route
      return true;
    } else {
      // If the user is not logged in, redirect to the home page
      return false;
    }
  }
}
