import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SocialUser } from '@abacritt/angularx-social-login';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  notloggedIn = true;
  private BASE_URL =
    'https://9e43-2409-40f4-1018-863d-d551-a7e6-113c-fd2f.ngrok-free.app ';

  constructor(private http: HttpClient) {}

  loginUser(user: SocialUser, userType: string): Observable<any> {
    // send the user information to the backend to get the JWT token
    const userData = {
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      userType: userType,
    };
    return this.http.post<any>(`${this.BASE_URL}/api/login`, userData);
    this.notloggedIn = false;
  }

  uploadData(formData: FormData) {
    return this.http.post<any>(`${this.BASE_URL}/uploadAdmin`, formData);
  }
  getData(year: any, section: any): Promise<any> {
    const data = {
      year: year,
      section: section,
    };
    return this.http.post<any>(`${this.BASE_URL}/getdata`, data).toPromise();
  }
  getMentorData(year: any, section: any) {
    const data = {
      year: year,
      section: section,
    };
    return this.http.post<any>(`${this.BASE_URL}/editmentor`, data);
  }
  updateStudent(
    name: any,
    regno: any,
    mailid: any,
    father: any,
    mother: any,
    year: any,
    sec: any
  ) {
    const data = {
      name: name,
      regno: regno,
      mailid: mailid,
      fatherno: father,
      motherno: mother,
      year: year,
      section: sec,
    };
    return this.http.post<any>(`${this.BASE_URL}/addStudent`, data);
  }
  editStudent(
    name: any,
    regno: any,
    mailid: any,
    father: any,
    mother: any,
    year: any,
    sec: any
  ) {
    const data = {
      name: name,
      regno: regno,
      mailid: mailid,
      fatherno: father,
      motherno: mother,
      year: year,
      section: sec,
    };
    return this.http.post<any>(`${this.BASE_URL}/editStudent`, data);
  }
  deleteStudent(regno: any, year: any, sec: any) {
    const data = {
      regno: regno,
      year: year,
      section: sec,
    };
    return this.http.post<any>(`${this.BASE_URL}/deleteStudent`, data);
  }
  updateMentor(
    year: any,
    section: any,
    mentor1: any,
    mentor2: any,
    mentor3: any
  ) {
    const data = {
      year: year,
      section: section,
      mentor1: mentor1,
      mentor2: mentor2,
      mentor3: mentor3,
    };
    return this.http.post<any>(`${this.BASE_URL}/updateMentor`, data);
  }

  getFacultyData(email: any) {
    const data = {
      email: email,
    };
    return this.http.post<any>(`${this.BASE_URL}/getFacultyData`, data);
  }
  getStudentData(email: any) {
    const data = {
      email: email,
    };
    return this.http.post<any>(`${this.BASE_URL}/getStudentData`, data);
  }

  getattendance(year: any, section: any, date: any) {
    const data = {
      year: year,
      section: section,
      date: date,
    };
    return this.http.post<any>(`${this.BASE_URL}/getattendance`, data);
  }
  getfattendance(date: any) {
    const data = {
      date: date,
    };
    return this.http.post<any>(`${this.BASE_URL}/getfattendance`, data);
  }
  recordattendance(year: any, section: any, date: any) {
    const data = {
      year: year,
      section: section,
      date: date,
    };
    return this.http.post<any>(`${this.BASE_URL}/recordattendance`, data);
  }
  updateattendance(
    year: any,
    section: any,
    regno: any,
    date: any,
    attendance: any
  ) {
    const data = {
      year: year,
      section: section,
      regno: regno,
      date: date,
      attendance: attendance,
    };
    return this.http.post<any>(`${this.BASE_URL}/updateattendance`, data);
  }
  getmonthattendance(year: any, section: any, startmonth: any, endmonth: any) {
    const data = {
      year: year,
      section: section,
      startmonth: startmonth,
      endmonth: endmonth,
    };
    return this.http.post<any>(`${this.BASE_URL}/getmonthattendance`, data);
  }
  getSmonthattendance(
    mail: any,
    year: any,
    section: any,
    startmonth: any,
    endmonth: any
  ) {
    const data = {
      mail: mail,
      year: year,
      section: section,
      startmonth: startmonth,
      endmonth: endmonth,
    };
    return this.http.post<any>(`${this.BASE_URL}/getSmonthattendance`, data);
  }
  getSdateattendance(
    mail: any,
    year: any,
    section: any,
    startdate: any,
    enddate: any
  ) {
    const data = {
      mail: mail,
      year: year,
      section: section,
      startdate: startdate,
      enddate: enddate,
    };
    return this.http.post<any>(`${this.BASE_URL}/getSdateattendance`, data);
  }
  getdateattendance(year: any, section: any, startdate: any, enddate: any) {
    const data = {
      year: year,
      section: section,
      startdate: startdate,
      enddate: enddate,
    };
    return this.http.post<any>(`${this.BASE_URL}/getdateattendance`, data);
  }
}
