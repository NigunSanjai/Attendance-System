import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-faculty',
  templateUrl: './faculty.component.html',
  styleUrls: ['./faculty.component.css'],
})
export class FacultyComponent {
  username = sessionStorage.getItem('user');
  url = sessionStorage.getItem('url');
  showLogout = false;
  facultyyear!: any;
  facultysec!: any;
  constructor(
    private authService: SocialAuthService,
    private router: Router,
    private auth: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.auth
      .getFacultyData(sessionStorage.getItem('email'))
      .subscribe((response) => {
        if (response.message == 'Got') {
          console.log(response.section);
          console.log(response.year);
        } else {
          this.toastr.warning('Check with Admin');
        }
      });
  }

  toggleLogout() {
    this.showLogout = !this.showLogout;
  }

  logout() {
    sessionStorage.clear();
    sessionStorage.setItem('notloggedin', 'true');
    this.authService.signOut();
    this.router.navigate(['']);
    // Clear session storage and navigate to home page
  }
}
