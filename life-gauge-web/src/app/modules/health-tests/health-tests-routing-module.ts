import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HealthTests } from './components/health-tests/health-tests';

const routes: Routes = [
  { path: '', component: HealthTests },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HealthTestsRoutingModule {}
