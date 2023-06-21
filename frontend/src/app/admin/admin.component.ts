import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';

import { AuthService } from '../auth.service';
import { Toast, ToastrService } from 'ngx-toastr';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';
import { GridOptions } from 'ag-grid-community';
import {
  ColDef,
  ColGroupDef,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import 'ag-grid-enterprise';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  username: string = sessionStorage.getItem('user') || '';
  url: string = sessionStorage.getItem('photo') || '';
  showLogout = false;
  showDash = true;
  showae = false;
  showv = false;
  showTable = false;
  showvTable = false;
  marginRight = '40rem';
  fileName = '';
  decide = false;
  csvData: any[] = [];
  pagData: any;
  dataSource: any;
  displayedColumns = [
    'Name of the Student',
    'Register Number',
    'Official Mail ID (College)',
    'Father Mobile number',
    'Mother Mobile number',
    'Edit',
    'Delete',
  ];
  options1: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  rselectedDate: string = '';
  userreqyear!: any;
  userreqsec!: any;
  myForm = new FormGroup({
    year: new FormControl('', [Validators.required]),
    section: new FormControl('', [Validators.required]),
    mentor1: new FormControl('', [Validators.required]),
    mentor2: new FormControl('', [Validators.required]),
    mentor3: new FormControl('', [Validators.required]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required]),
  });
  private gridApi!: GridApi;
  // public gridOptions: GridOptions = {};
  // public columnDefs: (ColDef | ColGroupDef)[] = [];
  // public defaultColDef: ColDef = {};
  rowData: any[];
  columnDefs: any[];
  @ViewChild(MatPaginator) paginatior!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  constructor(
    private router: Router,
    private authService: SocialAuthService,
    private fb: FormBuilder,
    private auth: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private matdialog: MatDialog
  ) {}

  ngOnInit() {
    sessionStorage.setItem('notloggedin', 'false');
  }

  toggleLogout() {
    this.showLogout = !this.showLogout;
  }
  toggleDash() {
    if (this.decide) {
      this.showDash = true;
      this.decide = false;
    }
    this.showae = false;
    this.showv = false;
    this.marginRight = '40rem';
    this.showvTable = false;
  }
  toggleae() {
    this.showae = true;
    this.showDash = false;
    this.decide = true;
    this.showTable = false;
    this.showv = false;
    this.marginRight = '20px';
    this.showvTable = false;
  }
  toggleview() {
    this.showae = false;
    this.showDash = false;
    this.showv = true;
    this.showvTable = false;
    this.marginRight = '20px';
  }
  logout() {
    sessionStorage.clear();
    sessionStorage.setItem('notloggedin', 'true');
    this.authService.signOut();
    this.router.navigate(['']);
    // Clear session storage and navigate to home page
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.myForm.patchValue({
      fileSource: file,
    });
  }
  openPopup() {
    const popup = this.matdialog.open(PopupComponent, {
      width: '80%',
      height: '420px',
      enterAnimationDuration: '1000ms',
      exitAnimationDuration: '1000ms',
      disableClose: true,
      data: {
        current: 'Add',
      },
    });
    popup.afterClosed().subscribe((item) => {
      if (item.action == 'add') {
        this.auth
          .updateStudent(
            item.name,
            item.registerNumber,
            item.mailid,
            item.fatherMobileNumber,
            item.motherMobileNumber,

            this.userreqyear,
            this.userreqsec
          )
          .subscribe((response) => {
            console.log(response);
            if (response.message == 'success') {
              this.toastr.success('Data added Sucessfully');
              this.getData();
            } else if (response.message == 'duplicate') {
              this.toastr.warning('Student Already Exists');
            }
          });
      }
    });
  }
  openMPopup() {
    let mentors: any[] = [];
    this.auth
      .getMentorData(this.userreqyear, this.userreqsec)
      .subscribe((response) => {
        mentors = response.data;
        console.log(mentors);
        const popup = this.matdialog.open(PopupComponent, {
          width: '80%',
          height: '420px',
          enterAnimationDuration: '1000ms',
          exitAnimationDuration: '1000ms',
          disableClose: true,
          data: {
            current: 'EditMentor',
            mentor: mentors,
          },
        });
        popup.afterClosed().subscribe((item) => {
          if (item.action == 'editmentor') {
            this.auth
              .updateMentor(
                this.userreqyear,
                this.userreqsec,
                item.mentor1,
                item.mentor2,
                item.mentor3
              )
              .subscribe((response) => {
                console.log(response);
                if (response.message == 'success') {
                  this.toastr.success('Change Done Sucessfully');
                  this.getData();
                }
              });
          }
        });
      });
  }

  editPopup(element: any) {
    console.log(element);
    const popup = this.matdialog.open(PopupComponent, {
      width: '80%',
      height: '420px',
      enterAnimationDuration: '1000ms',
      exitAnimationDuration: '1000ms',
      data: {
        current: 'Edit',
        name: element.name,
        registerNumber: element.register_no,
        mail_id: element.mail_id,
        father_mobile_number: element.father_mobile_number,
        mother_mobile_number: element.mother_mobile_number,
      },
    });
    popup.afterClosed().subscribe((item) => {
      if (item.action == 'add') {
        this.auth
          .editStudent(
            item.name,
            item.registerNumber,
            item.mail_id,
            item.father_mobile_number,
            item.mother_mobile_number,
            this.userreqyear,
            this.userreqsec
          )
          .subscribe((response) => {
            console.log(response);
            if (response.message == 'success') {
              this.toastr.success('Data Updated Sucessfully');
              this.getData();
            } else if (response.message == 'duplicate') {
              this.toastr.warning('Student Already Exists');
            }
          });
      }
    });
  }
  deletePopup(element: any) {
    console.log(element);
    const popup = this.matdialog.open(PopupComponent, {
      width: '80%',
      height: '420px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data: {
        current: 'Delete',
        registerNumber: element.register_no,
      },
    });
    popup.afterClosed().subscribe((item) => {
      if (item.action == 'delete') {
        this.auth
          .deleteStudent(item.registerNumber, this.userreqyear, this.userreqsec)
          .subscribe((response) => {
            console.log(response);
            if (response.message == 'success') {
              this.toastr.success('Data Deleted Sucessfully');
              this.getData();
            } else if (response.message == 'duplicate') {
              this.toastr.warning('Student Already Exists');
            }
          });
      }
    });
  }

  onSubmit() {
    console.log(this.myForm.get('mentor1').value);
    console.log(this.myForm.get('mentor2').value);
    console.log(this.myForm.get('mentor3').value);
    if (this.myForm.valid) {
      console.log('yes');
      console.log(this.myForm.value);
      const file = this.myForm.get('fileSource').value;
      //   Papa.parse(file, {
      //     complete: (result) => {
      //       this.csvData = result.data;
      //       console.log('CSV Data:', this.csvData);
      //     },
      //   });
      // }
      const formData = new FormData();
      formData.append('year', this.myForm.get('year').value);
      formData.append('section', this.myForm.get('section').value);
      formData.append('file', this.myForm.get('fileSource').value);
      formData.append('mentor1', this.myForm.get('mentor1').value);
      formData.append('mentor2', this.myForm.get('mentor2').value);
      if (this.myForm.get('mentor3').value) {
        formData.append('mentor3', this.myForm.get('mentor3').value);
      }

      this.auth.uploadData(formData).subscribe(
        (response) => {
          console.log('Upload response:', response);
          this.toastr.success(response.message);
        },
        (error) => {
          console.log('Upload error:', error);
          this.toastr.warning('Server Error');
        }
      );
    } else {
      this.toastr.error('Check with the details again!');
    }
  }
  getData() {
    console.log(this.userreqsec);
    console.log(this.userreqyear);
    this.auth.getData(this.userreqyear, this.userreqsec).then(
      (response) => {
        this.toastr.success('Sucess');
        this.pagData = response;
        this.showTable = true;
        this.dataSource = new MatTableDataSource([]);
        this.dataSource = new MatTableDataSource(this.pagData);
        this.pagData.sort(
          (a: { register_no: string }, b: { register_no: any }) => {
            // Assuming Register Number is a string
            return a.register_no.localeCompare(b.register_no);
          }
        );
        this.dataSource.sort = this.sort;
        this.cdr.detectChanges();
        this.dataSource.paginator = this.paginatior;

        console.log(this.pagData);
      },
      (error) => {
        this.toastr.warning('Check with the Details');
      }
    );
  }
  Filterchange(data: Event) {
    const value = (data.target as HTMLInputElement).value;
    this.dataSource.filter = value;
  }
  onDateSelected(event: any): void {
    this.showTable = false;
    this.rselectedDate = event.value.toLocaleString('en-US', this.options1);
    console.log(this.rselectedDate);
  }
  getfattendance() {
    this.columnDefs = [];
    this.rowData = [];
    this.auth.getfattendance(this.rselectedDate).subscribe((response) => {
      if (response.message === 'nope') {
        this.toastr.warning('Attendance not recorded Still');
      } else {
        this.columnDefs = [
          { headerName: 'Class', field: 'class' },
          {
            headerName: 'Forenoon',
            children: [
              { headerName: 'Total', field: 'forenoon.total' },
              { headerName: 'Present', field: 'forenoon.present' },
              { headerName: 'Absent', field: 'forenoon.absent' },
              { headerName: 'On-Duty', field: 'forenoon.on-duty' },
            ],
          },
          {
            headerName: 'Afternoon',
            children: [
              { headerName: 'Total', field: 'afternoon.total' },
              { headerName: 'Present', field: 'afternoon.present' },
              { headerName: 'Absent', field: 'afternoon.absent' },
              { headerName: 'On-Duty', field: 'afternoon.on-duty' },
            ],
          },
        ];
        this.rowData = this.transformResponse(response.data);
        this.showvTable = true;
      }
    });
  }
  transformResponse(response: any): any[] {
    const rowData = [];
    for (const section in response) {
      if (response.hasOwnProperty(section)) {
        const data = response[section];
        const row = {
          class: section,
          forenoon: {
            total: data.forenoon.total,
            present: data.forenoon.present,
            absent: data.forenoon.absent,
            'on-duty': data.forenoon['on-duty'],
          },
          afternoon: {
            total: data.afternoon.total,
            present: data.afternoon.present,
            absent: data.afternoon.absent,
            'on-duty': data.afternoon['on-duty'],
          },
        };
        rowData.push(row);
      }
    }

    return rowData;
  }
}
