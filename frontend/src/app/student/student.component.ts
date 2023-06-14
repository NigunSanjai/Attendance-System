import { Component, ViewEncapsulation } from '@angular/core';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';
import { GridOptions } from 'ag-grid-community';
import {
  ColDef,
  ColGroupDef,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import 'ag-grid-enterprise';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
const moment = _rollupMoment || _moment;
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
export const MY_DATE_FORMAT = 'MM/YYYY';
@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class StudentComponent {
  url: string = sessionStorage.getItem('photo');
  showLogout = false;
  dateType: any;
  endDate = new FormControl(moment());
  startDate = new FormControl(moment());
  showmt = false;
  showdt = false;
  startMonth: string;
  endMonth: string;
  sD: string;
  eD: string;
  private gridApi!: GridApi;
  public gridOptions: GridOptions = {};
  public columnDefs: (ColDef | ColGroupDef)[] = [];
  public defaultColDef: ColDef = {};
  public rowData!: [];
  private griddApi!: GridApi;
  public griddOptions: GridOptions = {};
  public columndDefs: (ColDef | ColGroupDef)[] = [];
  public ddefaultColDef: ColDef = {};
  public rowdData!: [];
  constructor(
    private router: Router,
    private authService: SocialAuthService,
    private auth: AuthService,
    private toastr: ToastrService
  ) {
    this.columnDefs = [
      {
        headerName: 'Name',
        field: 'name',
        sortingOrder: ['asc', 'desc'],
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Register Number',
        field: 'RegisterNumber',
        sortingOrder: ['asc', 'desc'],
        sortable: true,
        filter: true,
      },
    ];

    this.defaultColDef = {
      flex: 1,
      minWidth: 100,
      resizable: true,
    };
  }
  ngOnInit() {
    sessionStorage.setItem('notloggedin', 'false');
    if (!sessionStorage.getItem('section') && !sessionStorage.getItem('year')) {
      this.auth
        .getStudentData(sessionStorage.getItem('email'))
        .subscribe((response) => {
          if (response.message == 'Got') {
            sessionStorage.setItem('section', response.section);
            sessionStorage.setItem('year', response.year);
          } else {
            this.toastr.warning('Check with Admin');
          }
        });
    }
  }
  toggleLogout() {
    this.showLogout = !this.showLogout;
  }
  logout() {
    sessionStorage.clear();
    sessionStorage.setItem('notloggedin', 'true');
    this.authService.signOut();
    this.router.navigate(['']);
  }
  onAttSel() {
    this.showmt = false;
    this.showdt = false;
  }
  onSelect() {
    this.showmt = false;
    this.showdt = false;
    this.rowData = [];
    this.rowdData = [];

    this.columnDefs = [
      {
        headerName: 'Name',
        field: 'name',
        sortingOrder: ['asc', 'desc'],
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Register Number',
        field: 'RegisterNumber',
        sortingOrder: ['asc', 'desc'],
        sortable: true,
        filter: true,
      },
    ];

    this.defaultColDef = {
      flex: 1,
      minWidth: 100,
      resizable: true,
    };
    this.columndDefs = [
      {
        headerName: 'Name',
        field: 'name',
        sortingOrder: ['asc', 'desc'],
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Register Number',
        field: 'RegisterNumber',
        sortingOrder: ['asc', 'desc'],
        sortable: true,
        filter: true,
      },
    ];

    this.ddefaultColDef = {
      flex: 1,
      minWidth: 100,
      resizable: true,
    };
    this.startMonth = sessionStorage.getItem('sm');
    this.endMonth = sessionStorage.getItem('em');
    if (this.dateType === 'month') {
      console.log(`Selected months: ${this.startMonth}, ${this.endMonth}`);
      this.auth
        .getSmonthattendance(
          sessionStorage.getItem('email'),
          sessionStorage.getItem('year'),
          sessionStorage.getItem('section'),
          this.startMonth,
          this.endMonth
        )
        .subscribe((response: any) => {
          if (response.message == 'nomonth') {
            this.toastr.warning('No records found');
          }
          if (response.message == 'yes') {
            this.showmt = true;
            this.showdt = false;
            this.processSResponseData(response.data);
          }
        });
    }
    if (this.dateType === 'day') {
      this.sD = this.startDate.value.format('DD MMM YYYY');
      this.eD = this.endDate.value.format('DD MMM YYYY');
      console.log(this.sD, this.eD);
      this.auth
        .getSdateattendance(
          sessionStorage.getItem('email'),
          sessionStorage.getItem('year'),
          sessionStorage.getItem('section'),
          this.sD,
          this.eD
        )
        .subscribe((response: any) => {
          if (response.message == 'nomonth') {
            this.toastr.warning('No records found');
          }
          if (response.message == 'yes') {
            this.showdt = true;
            this.showmt = false;
            this.processSDResponseData(response.data);
          }
        });
    }
  }
  processSResponseData(data: any) {
    // Process the dynamic data and update columnDefs
    const months = Object.keys(data[0])
      .filter(
        (key) =>
          key !== 'name' &&
          key !== 'RegisterNumber' &&
          key !== 'working_days' &&
          key !== 'total_present' &&
          key !== 'total_absent' &&
          key !== 'total_onduty' &&
          key !== 'percentage'
      )
      .sort((a, b) => Date.parse(`01 ${a}`) - Date.parse(`01 ${b}`));
    console.log(months);

    months.forEach((month) => {
      const monthColumns = [
        {
          headerName: `Total Present`,
          valueGetter: function (params: { data: { [x: string]: any } }) {
            const rowData = params.data[month];
            return rowData.forenoon.present + rowData.afternoon.present;
          },
        },
        {
          headerName: `Total Absent`,
          valueGetter: function (params: { data: { [x: string]: any } }) {
            const rowData = params.data[month];
            return rowData.forenoon.absent + rowData.afternoon.absent;
          },
        },
        {
          headerName: `Total On-Duty`,
          valueGetter: function (params: { data: { [x: string]: any } }) {
            const rowData = params.data[month];
            return rowData.forenoon.onduty + rowData.afternoon.onduty;
          },
        },
      ];

      this.columnDefs.push({
        headerName: month,
        children: monthColumns,
        sortable: true,
        filter: true,
      });
    });
    this.columnDefs.push({
      headerName: 'Total Present',
      field: 'total_present',
      sortable: true,
      filter: true,
    });
    this.columnDefs.push({
      headerName: 'Total Absent',
      field: 'total_absent',
      sortable: true,
      filter: true,
    });
    this.columnDefs.push({
      headerName: 'Total On-Duty',
      field: 'total_onduty',
      sortable: true,
      filter: true,
    });
    this.columnDefs.push({
      headerName: 'Percentage',
      field: 'percentage',
      sortable: true,
      filter: true,
    });

    // Update rowData with the dynamic data
    this.rowData = data;
    console.log(this.rowData);
  }
  processSDResponseData(data: any) {
    // Process the dynamic data and update columnDefs
    const months = Object.keys(data[0])
      .filter(
        (key) =>
          key !== 'name' &&
          key !== 'RegisterNumber' &&
          key !== 'working_days' &&
          key !== 'total_present' &&
          key !== 'total_absent' &&
          key !== 'total_onduty' &&
          key !== 'percentage'
      )
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    console.log(months);

    months.forEach((month) => {
      const monthColumns = [
        {
          headerName: `Forenoon`,
          field: `${month}.forenoon`,
        },
        {
          headerName: `Afternoon`,
          field: `${month}.afternoon`,
        },
      ];

      this.columndDefs.push({
        headerName: month,
        children: monthColumns,
      });
    });

    // Update rowData with the dynamic data
    this.rowdData = data;
    console.log(this.rowData);
  }
}
