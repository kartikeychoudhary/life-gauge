import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared-module';
import { AppSettingsRoutingModule } from './app-settings-routing-module';
import { AppSettingsPage } from './components/app-settings/app-settings';

@NgModule({
  declarations: [AppSettingsPage],
  imports: [SharedModule, AppSettingsRoutingModule],
})
export class AppSettingsModule {}
