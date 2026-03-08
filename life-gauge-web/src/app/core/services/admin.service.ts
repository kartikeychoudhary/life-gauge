import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppSettings, AdminUser, TestDefinition } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ─── General Settings ───

  getAppSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.baseUrl}/settings`);
  }

  updateAppSetting(key: string, value: string): Observable<AppSettings> {
    return this.http.put<AppSettings>(`${this.baseUrl}/settings`, { key, value });
  }

  // ─── User Management ───

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/users`);
  }

  createUser(data: { name: string; email: string; password: string; role?: string }): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseUrl}/users`, data);
  }

  updateUserRole(id: number, role: string): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/users/${id}/role`, { role });
  }

  resetUserPassword(id: number, password: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/users/${id}/reset-password`, { password });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  // ─── Test Definitions ───

  listTestDefinitions(): Observable<TestDefinition[]> {
    return this.http.get<TestDefinition[]>(`${this.baseUrl}/test-definitions`);
  }

  createTestDefinition(data: Partial<TestDefinition>): Observable<TestDefinition> {
    return this.http.post<TestDefinition>(`${this.baseUrl}/test-definitions`, data);
  }

  updateTestDefinition(id: number, data: Partial<TestDefinition>): Observable<TestDefinition> {
    return this.http.put<TestDefinition>(`${this.baseUrl}/test-definitions/${id}`, data);
  }

  deleteTestDefinition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/test-definitions/${id}`);
  }
}
