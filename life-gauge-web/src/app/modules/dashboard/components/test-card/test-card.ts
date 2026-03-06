import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DashboardTest } from '../../../../core/models/health.model';

@Component({
  selector: 'app-test-card',
  standalone: false,
  templateUrl: './test-card.html',
  styleUrl: './test-card.scss',
})
export class TestCard {
  @Input() test!: DashboardTest;
  @Output() infoClick = new EventEmitter<void>();

  get flagSeverity(): 'success' | 'danger' | 'warn' | 'secondary' | 'info' | 'contrast' {
    switch (this.test.flag) {
      case 'normal': return 'success';
      case 'high': return 'danger';
      case 'low': return 'warn';
      case 'abnormal': return 'danger';
      default: return 'secondary';
    }
  }

  get flagLabel(): string {
    const map: Record<string, string> = {
      normal: 'Normal',
      high: 'High',
      low: 'Low',
      abnormal: 'Abnormal',
      unknown: 'N/A',
    };
    return map[this.test.flag] || 'N/A';
  }

  get trendIcon(): string {
    if (!this.test.previous || this.test.value_numeric === null || this.test.previous.value_numeric === null) {
      return '';
    }
    if (this.test.value_numeric > this.test.previous.value_numeric) return 'pi pi-arrow-up';
    if (this.test.value_numeric < this.test.previous.value_numeric) return 'pi pi-arrow-down';
    return 'pi pi-minus';
  }

  get trendClass(): string {
    if (!this.test.previous || this.test.value_numeric === null || this.test.previous.value_numeric === null) return '';
    if (this.test.value_numeric > this.test.previous.value_numeric) return 'text-orange-400';
    if (this.test.value_numeric < this.test.previous.value_numeric) return 'text-blue-400';
    return 'text-slate-400';
  }

  get hasRange(): boolean {
    return this.test.ref_min !== null || this.test.ref_max !== null;
  }

  get rangePercent(): number {
    if (!this.hasRange || this.test.value_numeric === null) return 0;
    const min = this.test.ref_min ?? 0;
    const max = this.test.ref_max ?? this.test.value_numeric * 2;
    const pct = ((this.test.value_numeric - min) / (max - min)) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }
}
