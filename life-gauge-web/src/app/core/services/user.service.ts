import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/auth.model';
import { UserSettings } from '../models/health.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/profile`);
  }

  updateProfile(data: { name?: string; email?: string }): Observable<User> {
    return this.http.put<User>(`${this.base}/profile`, data).pipe(
      tap((user) => this.authService.updateCurrentUser(user))
    );
  }

  changePassword(data: { current_password: string; new_password: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/password`, data);
  }

  getSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.base}/settings`);
  }

  updateSettings(data: { llm_api_key?: string; llm_model?: string }): Observable<UserSettings> {
    return this.http.put<UserSettings>(`${this.base}/settings`, data);
  }
}
