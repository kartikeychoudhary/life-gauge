import { NgModule } from '@angular/core';
import { DashboardRoutingModule } from './dashboard-routing-module';
import { SharedModule } from '../../shared-module';
import { Dashboard } from './components/dashboard/dashboard';
import { TestCard } from './components/test-card/test-card';
import { TestHistoryDialog } from './components/test-history-dialog/test-history-dialog';

@NgModule({
  declarations: [Dashboard, TestCard, TestHistoryDialog],
  imports: [SharedModule, DashboardRoutingModule],
})
export class DashboardModule {}
