import { ChangeDetectorRef, Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { HealthReportService } from '../../../../core/services/health-report.service';
import { HealthReport, TestResult } from '../../../../core/models/health.model';

@Component({
  selector: 'app-report-detail',
  standalone: false,
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.scss',
})
export class ReportDetail implements OnChanges {
  @Input() visible = false;
  @Input() report: HealthReport | null = null;
  @Output() close = new EventEmitter<void>();

  results: TestResult[] = [];
  loading = false;

  // Group results by category
  get groupedResults(): { category: string; tests: TestResult[] }[] {
    const map: Record<string, TestResult[]> = {};
    this.results.forEach((r) => {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    });
    return Object.entries(map).map(([category, tests]) => ({ category, tests }));
  }

  constructor(private reportService: HealthReportService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true && this.report) {
      this.loadDetail();
    }
  }

  loadDetail(): void {
    if (!this.report) return;
    this.loading = true;
    this.reportService.getOne(this.report.id).subscribe({
      next: (r) => {
        this.results = r.results || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  getFlagSeverity(flag: string): 'success' | 'danger' | 'warn' | 'secondary' | 'info' | 'contrast' {
    const map: Record<string, 'success' | 'danger' | 'warn' | 'secondary'> = {
      normal: 'success', high: 'danger', low: 'warn', abnormal: 'danger',
    };
    return map[flag] || 'secondary';
  }
}
