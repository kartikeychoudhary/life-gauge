import { ChangeDetectorRef, Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { TestResult } from '../../../../core/models/health.model';

@Component({
  selector: 'app-test-history-dialog',
  standalone: false,
  templateUrl: './test-history-dialog.html',
  styleUrl: './test-history-dialog.scss',
})
export class TestHistoryDialog implements OnChanges {
  @Input() visible = false;
  @Input() testKey = '';
  @Input() testName = '';
  @Output() close = new EventEmitter<void>();

  history: TestResult[] = [];
  loading = false;
  chartData: any = null;
  chartOptions: any = null;

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true && this.testKey) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.loading = true;
    this.dashboardService.getTestHistory(this.testKey).subscribe({
      next: (data) => {
        this.history = data;
        this.buildChart(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  buildChart(data: TestResult[]): void {
    const numeric = data.filter((d) => d.value_numeric !== null);
    if (!numeric.length) { this.chartData = null; return; }

    this.chartData = {
      labels: numeric.map((d) => d.report_date),
      datasets: [
        {
          label: this.testName,
          data: numeric.map((d) => d.value_numeric),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: numeric.map((d) =>
            d.flag === 'normal' ? '#22c55e' : d.flag === 'high' ? '#ef4444' : d.flag === 'low' ? '#f59e0b' : '#94a3b8'
          ),
          pointRadius: 5,
        },
      ],
    };

    // Reference range bands
    const refMin = numeric.find((d) => d.ref_min !== null)?.ref_min;
    const refMax = numeric.find((d) => d.ref_max !== null)?.ref_max;

    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.raw} ${numeric[ctx.dataIndex]?.unit || ''}`,
          },
        },
        annotation: refMin !== null && refMax !== null ? {
          annotations: {
            rangeBox: {
              type: 'box',
              yMin: refMin,
              yMax: refMax,
              backgroundColor: 'rgba(34,197,94,0.05)',
              borderColor: 'rgba(34,197,94,0.2)',
              borderWidth: 1,
            },
          },
        } : undefined,
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
      },
    };
  }

  getFlagSeverity(flag: string): 'success' | 'danger' | 'warn' | 'secondary' | 'info' | 'contrast' {
    const map: Record<string, 'success' | 'danger' | 'warn' | 'secondary'> = {
      normal: 'success', high: 'danger', low: 'warn', abnormal: 'danger',
    };
    return map[flag] || 'secondary';
  }
}
