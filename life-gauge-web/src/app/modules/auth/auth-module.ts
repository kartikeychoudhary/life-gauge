import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing-module';
import { SharedModule } from '../../shared-module';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

@NgModule({
  declarations: [Login, Register],
  imports: [SharedModule, AuthRoutingModule],
})
export class AuthModule {}
