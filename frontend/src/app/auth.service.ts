import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SocialUser } from '@abacritt/angularx-social-login';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  notloggedIn = true;
  private BASE_URL = 'http://127.0.0.1:5000';

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
}
