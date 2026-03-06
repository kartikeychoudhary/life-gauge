import { NgModule } from '@angular/core';
import { SettingsRoutingModule } from './settings-routing-module';
import { SharedModule } from '../../shared-module';
import { Settings } from './components/settings/settings';

@NgModule({
  declarations: [Settings],
  imports: [SharedModule, SettingsRoutingModule],
})
export class SettingsModule {}
