import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';
import * as Papa from 'papaparse';
import { AuthService } from '../auth.service';
import { Toast, ToastrService } from 'ngx-toastr';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';

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
  showTable = false;
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
    this.marginRight = '40rem';
  }
  toggleae() {
    this.showae = true;
    this.showDash = false;
    this.decide = true;
    this.showTable = false;
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
      enterAnimationDuration: '1000ms',
      exitAnimationDuration: '1000ms',
      data: {
        current: 'Delete',
      },
    });
    popup.afterClosed().subscribe((item) => {
      if (item.action == 'delete') {
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
}
