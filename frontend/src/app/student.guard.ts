import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StudentGuard implements CanActivate {
  constructor(private route: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (
      sessionStorage.getItem('token') &&
      sessionStorage.getItem('user') == 'STUDENT'
    ) {
      // If the user is logged in, allow access to the route
      return true;
    } else {
      this.route.navigate(['']);
      // If the user is not logged in, redirect to the home page
      return false;
    }
  }
}
