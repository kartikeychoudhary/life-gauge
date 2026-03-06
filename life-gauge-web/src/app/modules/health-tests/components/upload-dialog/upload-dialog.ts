import { ChangeDetectorRef, Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { HealthReportService } from '../../../../core/services/health-report.service';
import { HealthReport } from '../../../../core/models/health.model';

@Component({
  selector: 'app-upload-dialog',
  standalone: false,
  templateUrl: './upload-dialog.html',
  styleUrl: './upload-dialog.scss',
})
export class UploadDialog implements OnDestroy {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<HealthReport>();

  selectedFile: File | null = null;
  uploading = false;
  processing = false;
  processingFailed = false;
  progressPercent = 0;
  dragOver = false;

  private streamSub: Subscription | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private reportService: HealthReportService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.cleanup();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  setFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.messageService.add({ severity: 'warn', summary: 'Invalid file', detail: 'Only PDF files are accepted' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.messageService.add({ severity: 'warn', summary: 'File too large', detail: 'Maximum size is 20 MB' });
      return;
    }
    this.selectedFile = file;
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.reportService.upload(this.selectedFile).subscribe({
      next: (report) => {
        this.uploading = false;
        this.selectedFile = null;

        if (report.status === 'processing') {
          this.startProcessing(report);
        } else {
          // pending (no API key configured) or instantly completed
          this.uploaded.emit(report);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploading = false;
        this.cdr.detectChanges();
        this.messageService.add({
          severity: 'error',
          summary: 'Upload failed',
          detail: err?.error?.message || 'Could not upload file',
        });
      },
    });
  }

  private startProcessing(report: HealthReport): void {
    this.processing = true;
    this.progressPercent = 5;

    // Animate progress to ~88% while waiting for SSE completion
    this.progressInterval = setInterval(() => {
      if (this.progressPercent < 88) {
        this.progressPercent = Math.min(88, this.progressPercent + Math.random() * 4);
        this.cdr.detectChanges();
      }
    }, 600);

    this.streamSub = this.reportService.streamStatus(report.id).subscribe({
      next: (event) => {
        if (event.status === 'completed') {
          this.finishProcessing(report, false);
        } else if (event.status === 'failed') {
          this.finishProcessing(report, true);
        }
      },
      complete: () => {
        // SSE closed unexpectedly — dismiss with current report
        if (this.processing) {
          this.cleanup();
          this.processing = false;
          this.uploaded.emit(report);
          this.cdr.detectChanges();
        }
      },
    });
  }

  private finishProcessing(report: HealthReport, failed: boolean): void {
    this.cleanup();
    this.processingFailed = failed;
    this.progressPercent = 100;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.processing = false;
      this.processingFailed = false;
      this.progressPercent = 0;
      this.uploaded.emit({ ...report, status: failed ? 'failed' : 'completed' });
      this.cdr.detectChanges();
    }, failed ? 1500 : 600);
  }

  private cleanup(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  dismiss(): void {
    this.cleanup();
    this.selectedFile = null;
    this.processing = false;
    this.processingFailed = false;
    this.progressPercent = 0;
    this.close.emit();
  }
}
