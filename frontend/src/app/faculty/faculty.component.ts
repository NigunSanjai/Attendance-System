import { SocialAuthService } from '@abacritt/angularx-social-login';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { FormControl } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-faculty',
  templateUrl: './faculty.component.html',
  styleUrls: ['./faculty.component.css'],
})
export class FacultyComponent {
  username = sessionStorage.getItem('user');
  url = sessionStorage.getItem('photo');
  showLogout = false;
  displaydata: any;
  showDash = true;
  showae = false;
  decide = false;
  pageSize = 5;
  pageIndex = 0;
  pageEvent: PageEvent;
  displayedColumns: string[] = [
    'Name of the Student',
    'Register Number',
    'Forenoon',
    'Afternoon',
  ];
  attendance_data: any;
  forenoonChecked = false;
  afternoonChecked = false;
  showTable = false;
  currentDate: Date = new Date();
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  };
  options1: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  formattedDate: string = this.currentDate.toLocaleString(
    'en-US',
    this.options
  );
  selectedDate: string = '';
  minDate: Date;
  maxDate: Date;
  dateControl = new FormControl();
  @ViewChild(MatPaginator) paginatior!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  dataSource: any;

  constructor(
    private authService: SocialAuthService,
    private router: Router,
    private auth: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() - 2);
    this.maxDate = new Date();
  }

  ngOnInit() {
    if (!sessionStorage.getItem('section') && !sessionStorage.getItem('year')) {
      this.auth
        .getFacultyData(sessionStorage.getItem('email'))
        .subscribe((response) => {
          if (response.message == 'Got') {
            sessionStorage.setItem('section', response.section);
            sessionStorage.setItem('year', response.year);
          } else {
            this.toastr.warning('Check with Admin');
          }
        });
    }
    this.dataSource = new MatTableDataSource([]);
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
  toggleDash() {
    if (this.decide) {
      this.showDash = true;
      this.decide = false;
    }
    this.showae = false;
    console.log('dash');
  }
  toggleae() {
    this.showae = true;
    this.showDash = false;
    this.decide = true;
    this.showTable = false;

    console.log('add');
  }
  onDateSelected(event: any): void {
    this.showTable = false;
    this.selectedDate = event.value.toLocaleString('en-US', this.options1);
    console.log(this.selectedDate);
  }
  getattendance() {
    this.auth
      .getattendance(
        sessionStorage.getItem('year'),
        sessionStorage.getItem('section'),
        this.selectedDate
      )
      .subscribe((response) => {
        if (response.message == 'nodate') {
          this.toastr.warning('Enter the Date');
        } else {
          this.displaydata = response.data;
          this.attendance_data = response.atten_det;
          console.log(this.displaydata);
          console.log(this.attendance_data);
          this.showTable = true;
          this.dataSource = new MatTableDataSource([]);
          this.dataSource = new MatTableDataSource(this.displaydata);
          this.dataSource.sort = this.sort;
          this.cdr.detectChanges();
          this.dataSource.paginator = this.paginatior;
          this.dataSource.data.forEach((row: any) => {
            if (row.attendance.slice(0, 4).every((a: number) => a === 1)) {
              row.forenoon = true;
            }
            if (row.attendance.slice(4, 7).every((a: number) => a === 1)) {
              row.afternoon = true;
            }
            if (row.attendance.slice(0, 4).every((a: number) => a === 0.5)) {
              row.onduty_forenoon = true;
            }
            if (row.attendance.slice(4, 7).every((a: number) => a === 0.5)) {
              row.onduty_afternoon = true;
            }
          });
        }
      });
  }
  checkboxChanged(type: string, row: any, event: MatCheckboxChange) {
    const isForenoon = type;
    const checked = event.checked ? 1 : 0;
    const odchecked = event.checked ? 0.5 : 0;
    row[type] = event.checked;
    if (isForenoon == 'forenoon') {
      row.attendance[0] = checked;
      row.attendance[1] = checked;
      row.attendance[2] = checked;
      row.attendance[3] = checked;
      this.checkForenoonAttendance(row, event);
    }
    if (isForenoon == 'afternoon') {
      row.attendance[4] = checked;
      row.attendance[5] = checked;
      row.attendance[6] = checked;
      this.checkAfternoonAttendance(row, event);
    }
    if (isForenoon == 'onduty_forenoon') {
      row.attendance[0] = odchecked;
      row.attendance[1] = odchecked;
      row.attendance[2] = odchecked;
      row.attendance[3] = odchecked;
      this.checkForenoonOd(row, event);
    }
    if (isForenoon == 'onduty_afternoon') {
      row.attendance[4] = odchecked;
      row.attendance[5] = odchecked;
      row.attendance[6] = odchecked;
      this.checkAfternoonOd(row, event);
    }
    this.auth
      .updateattendance(
        sessionStorage.getItem('year'),
        sessionStorage.getItem('section'),
        row.reg_no,
        this.selectedDate,
        row.attendance
      )
      .subscribe((response: any) => {
        this.attendance_data = response.atten_det;
      });
    console.log({
      name: row.name,
      regno: row.reg_no,
      attendance: row.attendance,
    });
  }
  // masterToggle(column: string, event: any) {
  //   if (column === 'forenoon') {
  //     this.forenoonChecked = event.checked;
  //   } else if (column === 'afternoon') {
  //     this.afternoonChecked = event.checked;
  //   }
  //   this.dataSource.filteredData.forEach(
  //     (row: any) => (row[column] = event.checked)
  //   );
  //   console.log(
  //     this.dataSource.filteredData.map((row: any) => {
  //       return {
  //         name: row.name,
  //         regno: row.reg_no,
  //         forenoon: row.forenoon,
  //         afternoon: row.afternoon,
  //       };
  //     })
  //   );
  // }
  masterToggle(type: string, event: MatCheckboxChange) {
    const isForenoon = type;
    const checked = event.checked ? 1 : 0;
    this.dataSource.data.forEach((row: any) => {
      row[type] = event.checked;
      if (isForenoon == 'forenoon') {
        row.attendance[0] = checked;
        row.attendance[1] = checked;
        row.attendance[2] = checked;
        row.attendance[3] = checked;
        this.checkForenoonAttendance(row, event);
      }
      if (isForenoon == 'afternoon') {
        row.attendance[4] = checked;
        row.attendance[5] = checked;
        row.attendance[6] = checked;
        this.checkAfternoonAttendance(row, event);
      }
      this.auth
        .updateattendance(
          sessionStorage.getItem('year'),
          sessionStorage.getItem('section'),
          row.reg_no,
          this.selectedDate,
          row.attendance
        )
        .subscribe((response: any) => {
          this.attendance_data = response.atten_det;
        });
      console.log(row.attendance);
    });
  }
  // checkAll(type: string, event: any) {
  //   const checked = event.checked;
  //   if (type === 'forenoon') {
  //     this.dataSource.filteredData.forEach((row: any) => {
  //       row.forenoon = checked;
  //     });
  //   } else if (type === 'afternoon') {
  //     this.dataSource.filteredData.forEach((row: any) => {
  //       row.afternoon = checked;
  //     });
  //   }
  // }
  checkForenoonAttendance(row: any, event: any): boolean {
    const checked = event.checked;
    if (row.attendance.slice(0, 4).every((a: number) => a === 1)) {
      row.forenoon = true;
      row.onduty_forenoon = false;
    } else {
      row.forenoon = false;
    }

    return row.attendance.slice(0, 4).every((a: number) => a === 1);
  }
  checkAfternoonAttendance(row: any, event: any): boolean {
    const checked = event.checked;
    if (row.attendance.slice(4, 7).every((a: number) => a === 1)) {
      row.afternoon = true;
      row.onduty_afternoon = false;
    } else {
      row.afternoon = false;
    }
    return row.attendance.slice(4, 7).every((a: number) => a === 1);
  }
  checkForenoonOd(row: any, event: any): boolean {
    const checked = event.checked;
    if (row.attendance.slice(0, 4).every((a: number) => a === 0.5)) {
      row.onduty_forenoon = true;
      row.forenoon = false;
    } else {
      row.onduty_forenoon = false;
    }
    return row.attendance.slice(0, 4).every((a: number) => a === 0.5);
  }
  checkAfternoonOd(row: any, event: any): boolean {
    const checked = event.checked;
    if (row.attendance.slice(4, 7).every((a: number) => a === 0.5)) {
      row.onduty_afternoon = true;
      row.afternoon = false;
    } else {
      row.onduty_afternoon = false;
    }
    return row.attendance.slice(4, 7).every((a: number) => a === 0.5);
  }
  Filterchange(data: Event) {
    const value = (data.target as HTMLInputElement).value;
    this.dataSource.filter = value;
  }
}
