import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardCategory, DashboardTest } from '../../../../core/models/health.model';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  categories: DashboardCategory[] = [];
  loading = true;
  searchQuery = '';
  selectedFlags: string[] = [];

  readonly flagOptions = [
    { label: 'Normal',   value: 'normal',   severity: 'success' },
    { label: 'High',     value: 'high',     severity: 'danger' },
    { label: 'Low',      value: 'low',      severity: 'warn' },
    { label: 'Abnormal', value: 'abnormal', severity: 'danger' },
    { label: 'Unknown',  value: 'unknown',  severity: 'secondary' },
  ];

  historyDialogVisible = false;
  historyTestKey = '';
  historyTestName = '';

  get filteredCategories(): DashboardCategory[] {
    const q = this.searchQuery.trim().toLowerCase();
    const flags = this.selectedFlags;
    return this.categories
      .map(cat => ({
        ...cat,
        tests: cat.tests.filter(t => {
          const matchesSearch = !q || t.display_name.toLowerCase().includes(q) || t.test_key.toLowerCase().includes(q);
          const matchesFlag   = !flags.length || flags.includes(t.flag);
          return matchesSearch && matchesFlag;
        }),
      }))
      .filter(cat => cat.tests.length > 0);
  }

  constructor(
    private dashboardService: DashboardService,
    private messageService: MessageService,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load dashboard' });
      },
    });
  }

  openHistory(test: DashboardTest): void {
    this.historyTestKey = test.test_key;
    this.historyTestName = test.display_name;
    this.historyDialogVisible = true;
  }

  closeHistory(): void {
    this.historyDialogVisible = false;
  }
}
