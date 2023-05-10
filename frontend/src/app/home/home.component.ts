import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Component, OnInit } from '@angular/core';
import { Toast, ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/auth.service';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  user: SocialUser;
  loggedIn: boolean;
  adminEmail = 'departmentcsekpr@gmail.com';
  userType: string;
  constructor(
    private authService: SocialAuthService,
    private toastr: ToastrService,
    private authServiceApi: AuthService,
    private router: Router,
    private cookieService: CookieService
  ) {
    // sessionStorage.setItem('notloggedin', 'true');
  }
  ngOnInit() {
    sessionStorage.clear();
    sessionStorage.setItem('notloggedin', 'true');
    this.cookieService.deleteAll();
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = user != null;
      if (this.user && this.user.email) {
        if (this.user.email === this.adminEmail) {
          // Admin email starts with 'admin'
          this.userType = 'admin';
          this.toastr.success('Welcome Admin');
        }
        //  else if (
        //   this.user.email.match(/^\d+/) &&
        //   this.user.email.endsWith('@kpriet.ac.in')
        // ) {
        //   // Student email starts with a number
        //   this.userType = 'student';
        //   this.toastr.success('Welcome student');
        // }
        else if (
          this.user.email.match(/^[a-zA-Z]/) &&
          this.user.email.endsWith('@kpriet.ac.in')
        ) {
          // Faculty email starts with a letter
          this.userType = 'faculty';
          this.toastr.success('Welcome faculty');
        } else {
          this.userType = 'invalid';
          this.toastr.error('Unknown user type');
        }

        // send the user information to the backend to get the JWT token
        if (this.userType != 'invalid') {
          this.authServiceApi.loginUser(this.user, this.userType).subscribe(
            (response: any) => {
              console.log(response);
              if (response) {
                console.log('yes');
                // store the JWT token in local storage
                sessionStorage.setItem('token', response.access_token);
                sessionStorage.setItem('notloggedin', 'false');

                // redirect the user to the appropriate component based on user type
                if (this.userType === 'admin') {
                  sessionStorage.setItem('user', this.userType.toUpperCase());
                  sessionStorage.setItem('name', this.user.firstName);
                  sessionStorage.setItem('photo', this.user.photoUrl);
                  this.router.navigate(['admin']);
                } else if (this.userType === 'faculty') {
                  sessionStorage.setItem('email', this.user.email);
                  sessionStorage.setItem('user', this.userType.toUpperCase());
                  sessionStorage.setItem('name', this.user.firstName);
                  sessionStorage.setItem('photo', this.user.photoUrl);
                  this.router.navigate(['faculty']);
                } else if (this.userType === 'student') {
                  sessionStorage.setItem('user', this.userType.toUpperCase());
                  sessionStorage.setItem('name', this.user.firstName);
                  sessionStorage.setItem('photo', this.user.photoUrl);
                  this.router.navigate(['student']);
                }
              }
            },
            (error: any) => {
              console.log(error);
              this.toastr.error('Error logging in. Please try again later.');
            }
          );
        }
      }
    });
  }
}
