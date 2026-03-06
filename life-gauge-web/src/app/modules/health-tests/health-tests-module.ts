import { NgModule } from '@angular/core';
import { HealthTestsRoutingModule } from './health-tests-routing-module';
import { SharedModule } from '../../shared-module';
import { HealthTests } from './components/health-tests/health-tests';
import { UploadDialog } from './components/upload-dialog/upload-dialog';
import { ReportDetail } from './components/report-detail/report-detail';

@NgModule({
  declarations: [HealthTests, UploadDialog, ReportDetail],
  imports: [SharedModule, HealthTestsRoutingModule],
})
export class HealthTestsModule {}
