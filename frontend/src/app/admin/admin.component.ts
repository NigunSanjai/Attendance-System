import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    if (sessionStorage.getItem('token') && sessionStorage.getItem('user')) {
      // If user and token are present in session storage, prevent navigation
      this.router.navigate(['/admin']);
    }
  }

  logout() {
    // Clear session storage and navigate to home page
    sessionStorage.clear();
    this.router.navigate(['/']);
  }
}
