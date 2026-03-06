import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared-module';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';
import { MainLayout } from './components/main-layout/main-layout';

@NgModule({
  declarations: [Sidebar, Header, MainLayout],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [MainLayout],
})
export class LayoutModule {}
