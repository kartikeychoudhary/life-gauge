import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardCategory, TestResult } from '../models/health.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = `${environment.apiBaseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardCategory[]> {
    return this.http.get<DashboardCategory[]>(`${this.base}/summary`);
  }

  getTestHistory(key: string): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.base}/test/${key}/history`);
  }
}
