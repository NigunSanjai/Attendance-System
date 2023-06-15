import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css'],
})
export class PopupComponent {
  result!: any;
  showAdd = false;
  showEdit = false;
  showDelete = false;
  deleno = '';
  studentData = {
    name: '',
    registerNumber: '',
    mailid: '',
    fatherMobileNumber: '',
    motherMobileNumber: '',
    action: '',
  };
  editData = {
    name: '',
    registerNumber: '',
    mail_id: '',
    father_mobile_number: '',
    mother_mobile_number: '',
    action: '',
  };
  deleteData = {
    action: '',
    registerNumber: '',
  };
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private Ref: MatDialogRef<PopupComponent>,
    private toastr: ToastrService
  ) {}
  ngOnInit(): void {
    this.result = this.data;
    console.log(this.result.current);
    if (this.result.current == 'Add') {
      this.showAdd = true;
    }
    if (this.result.current == 'Edit') {
      this.editData = this.result;
      this.showEdit = true;
    }
    if (this.result.current == 'Delete') {
      this.showDelete = true;
      this.deleteData.registerNumber = this.result.registerNumber;
    }
  }

  submit() {
    console.log(this.studentData.registerNumber);

    if (/^.{7}$/.test(this.studentData.registerNumber)) {
      console.log('yes');
      if (/^[6789]\d{9}$/.test(this.studentData.fatherMobileNumber)) {
        console.log('yes');
        if (/^[6789]\d{9}$/.test(this.studentData.motherMobileNumber)) {
          this.studentData.action = 'add';
          this.studentData.registerNumber =
            this.studentData.registerNumber.toUpperCase();
          this.Ref.close(this.studentData);
        }
      }
    } else {
      this.toastr.error('Invalid input');
    }
  }
  editsubmit() {
    console.log(this.editData.registerNumber);
    console.log(this.editData);

    if (/^.{7,8}$/.test(this.editData.registerNumber)) {
      console.log('yes');
      if (/^[6789]\d{9}$/.test(this.editData.father_mobile_number)) {
        if (/^[6789]\d{9}$/.test(this.editData.mother_mobile_number)) {
          console.log('yes');
          this.editData.action = 'add';
          this.editData.registerNumber =
            this.editData.registerNumber.toUpperCase();
          this.Ref.close(this.editData);
        }
      }
    } else {
      this.toastr.error('Invalid input');
    }
  }
  deleteSubmit() {
    this.deleteData.action = 'delete';
    this.Ref.close(this.deleteData);
  }
}
