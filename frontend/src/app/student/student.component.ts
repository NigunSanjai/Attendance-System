import { Component } from '@angular/core';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css'],
})
export class StudentComponent {
  ngOnInit() {
    console.log(sessionStorage.getItem('token'));
    console.log(sessionStorage.getItem('user'));
  }
}
