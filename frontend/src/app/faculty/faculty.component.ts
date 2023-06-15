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
// import { MatDatepicker } from '@angular/material/datepicker';
// import { Exporter, MatTableExporterModule } from 'mat-table-exporter';
// import { MAT_TABLE_EXPORTER } from 'mat-table-exporter';
// import { MatTableExporterDirective } from 'mat-table-exporter';
import { ViewEncapsulation } from '@angular/core';
import { ElementRef } from '@angular/core';
import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
import { GridOptions } from 'ag-grid-community';
import {
  ColDef,
  ColGroupDef,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import 'ag-grid-enterprise';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';
import { filter } from 'rxjs';

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
  selector: 'app-faculty',
  templateUrl: './faculty.component.html',
  styleUrls: ['./faculty.component.css'],
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
export class FacultyComponent {
  username = sessionStorage.getItem('user');
  url = sessionStorage.getItem('photo');
  showLogout = false;
  displaydata: any;
  showDash = true;
  showae = false;
  decide = false;
  displayedColumns: string[] = [
    'Name of the Student',
    'Register Number',
    'Forenoon',
    'Afternoon',
  ];
  // rowData: any[];
  // columnDefs: any[];
  // defaultColDef: any;
  displayedAttendancecolumns: string[];
  attendancedataSource: any;
  daywisedataSource: any;
  columns: string[] = [];
  months: string[] = [];
  dcolumns: string[] = [];
  ddates: string[] = [];
  details: string[] = [];
  attendance_data: any;
  // forenoonChecked = false;
  // afternoonChecked = false;
  showTable = false;
  showmt = false;
  showdt = false;
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
  dateType: any;
  endDate = new FormControl(moment());
  startDate = new FormControl(moment());
  sD: any;
  eD: any;
  selectsType: boolean;
  selecteType: boolean;
  MY_DATE_FORMAT = 'MM/YYYY';
  displayDate: any;
  startMonth: any;
  endMonth: any;
  workingdays: any;
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
  private sortingOrder: any;
  showres = false;
  showsub = true;
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
    this.displayedAttendancecolumns = [];
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
  }

  ngOnInit() {
    this.showmt = false;
    sessionStorage.setItem('notloggedin', 'false');
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
    this.attendancedataSource = new MatTableDataSource([]);
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
  reset() {
    this.showTable = false;
    this.showres = false;
    this.showsub = true;
  }
  record() {
    this.selectedDate = moment(this.selectedDate).format('MMM DD, YYYY');
    this.auth
      .recordattendance(
        sessionStorage.getItem('year'),
        sessionStorage.getItem('section'),
        this.selectedDate
      )
      .subscribe((response) => {
        if (response.message == 'success') {
          this.toastr.success('Updated');
        }
      });
  }
  getattendance() {
    this.showsub = false;
    this.showres = true;
    this.showTable = true;
    this.selectedDate = moment(this.selectedDate).format('MMM DD, YYYY');
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

  onAttSel() {
    this.showmt = false;
    this.showdt = false;
  }

  onSelect() {
    this.attendancedataSource = [];
    this.columns = [];
    this.months = [];
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
    this.showmt = false;
    this.showdt = false;
    this.startMonth = sessionStorage.getItem('sm');
    this.endMonth = sessionStorage.getItem('em');
    if (this.dateType === 'month') {
      // handle startMonth and endMonth
      console.log(`Selected months: ${this.startMonth}, ${this.endMonth}`);
      this.auth
        .getmonthattendance(
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
            this.processResponseData(response.data);
          }
        });
    }

    if (this.dateType === 'day') {
      // handle startMonth and endMonth
      this.sD = this.startDate.value.format('DD MMM YYYY');
      this.eD = this.endDate.value.format('DD MMM YYYY');
      console.log(this.sD, this.eD);
      this.auth
        .getdateattendance(
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
            this.processDResponseData(response.data);
          }
        });
    } else {
      console.log(
        `Selected dates: ${this.startDate.value.format(
          'MMM DD, YYYY'
        )}, ${this.endDate.value.format('MMM DD, YYYY')}`
      );
    }
  }
  getTableWidth() {
    console.log(100 * this.columns.length + '%');
    return 300 + this.months.length * 100 + '%';
  }
  @ViewChild('TABLE') table: ElementRef;
  exportAsExcel() {
    const params = {
      fileName: 'exportedData',
    };
    this.gridApi.exportDataAsExcel(params);
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
  }
  ondGridReady(params: any) {
    this.griddApi = params.api;
  }
  processResponseData(data: any) {
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
  processDResponseData(data: any) {
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

  // exportTable() {
  //   const documentDefinition = this.exporter.generateExportedTable('pdf', {
  //     fileName: 'attendance',
  //     sheetName: 'Sheet1',
  //     style: {
  //       headerRow: {
  //         fillColor: '#eeeeee',
  //         bold: true,
  //       },
  //       contentCell: {
  //         fillColor: '#ffffff',
  //       },
  //     },
  //   });

  //   pdfMake.createPdf(documentDefinition).download();
  // }

  // // @ViewChild(MatTableExporterDirective) exporter: MatTableExporterDirective;
  // // exportTable() {
  // //   this.exporter.exportTable('csv', {
  // //     fileName: 'attendance-data',
  // //   });
  // }
}
