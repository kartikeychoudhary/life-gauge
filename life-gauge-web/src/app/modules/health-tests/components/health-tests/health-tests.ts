import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HealthReportService } from '../../../../core/services/health-report.service';
import { HealthReport, PaginationMeta } from '../../../../core/models/health.model';

@Component({
  selector: 'app-health-tests',
  standalone: false,
  templateUrl: './health-tests.html',
  styleUrl: './health-tests.scss',
})
export class HealthTests implements OnInit {
  reports: HealthReport[] = [];
  meta: PaginationMeta = { total: 0, page: 1, limit: 20, pages: 1 };
  loading = true;

  uploadDialogVisible = false;
  selectedReport: HealthReport | null = null;
  detailVisible = false;

  constructor(
    private reportService: HealthReportService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(page = 1): void {
    this.loading = true;
    this.reportService.list(page, this.meta.limit).subscribe({
      next: (res) => {
        this.reports = res.reports;
        this.meta = res.meta;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load reports' });
      },
    });
  }

  onUploadSuccess(report: HealthReport): void {
    this.uploadDialogVisible = false;
    this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Report is being processed' });
    this.load();
  }

  viewDetail(report: HealthReport): void {
    this.selectedReport = report;
    this.detailVisible = true;
  }

  reprocess(report: HealthReport): void {
    this.reportService.reprocess(report.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Reprocessing', detail: 'Report sent to AI for parsing' });
        this.load();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to reprocess' });
      },
    });
  }

  confirmDelete(report: HealthReport): void {
    this.confirmationService.confirm({
      message: `Delete "${report.original_filename}"? This cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.doDelete(report),
    });
  }

  private doDelete(report: HealthReport): void {
    this.reportService.delete(report.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Report removed' });
        this.load();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete report' });
      },
    });
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' | 'info' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      completed: 'success', processing: 'info', pending: 'warn', failed: 'danger',
    };
    return map[status] || 'secondary';
  }
}
