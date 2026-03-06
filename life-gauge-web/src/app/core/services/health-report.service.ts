import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HealthReport, PaginatedReports } from '../models/health.model';
import { AuthService } from './auth.service';

export interface ReportStatusEvent {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  error_message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class HealthReportService {
  private base = `${environment.apiBaseUrl}/health-reports`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  list(page = 1, limit = 20): Observable<PaginatedReports> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedReports>(this.base, { params });
  }

  getOne(id: number): Observable<HealthReport> {
    return this.http.get<HealthReport>(`${this.base}/${id}`);
  }

  upload(file: File): Observable<HealthReport> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<HealthReport>(`${this.base}/upload`, form);
  }

  reprocess(id: number): Observable<HealthReport> {
    return this.http.post<HealthReport>(`${this.base}/${id}/reprocess`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  streamStatus(id: number): Observable<ReportStatusEvent> {
    return new Observable<ReportStatusEvent>((observer) => {
      const token = this.authService.getToken();
      const url = `${this.base}/${id}/stream?token=${encodeURIComponent(token ?? '')}`;
      const es = new EventSource(url);

      es.onmessage = (event) => {
        const data: ReportStatusEvent = JSON.parse(event.data);
        observer.next(data);
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'not_found') {
          es.close();
          observer.complete();
        }
      };

      es.onerror = () => {
        es.close();
        observer.complete();
      };

      return () => es.close();
    });
  }
}
