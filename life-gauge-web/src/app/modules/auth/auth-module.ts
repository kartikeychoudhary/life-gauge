import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing-module';
import { SharedModule } from '../../shared-module';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ChangePassword } from './components/change-password/change-password';

@NgModule({
  declarations: [Login, Register, ChangePassword],
  imports: [SharedModule, AuthRoutingModule],
})
export class AuthModule {}
