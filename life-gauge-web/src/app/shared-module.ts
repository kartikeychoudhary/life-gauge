import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { FileUploadModule } from 'primeng/fileupload';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

const PRIMENG = [
  ButtonModule, InputTextModule, TextareaModule, PasswordModule, CardModule, ToastModule,
  DialogModule, ProgressSpinnerModule, TagModule, TooltipModule,
  ConfirmDialogModule, TableModule, ChartModule, BadgeModule,
  DividerModule, SelectModule, MultiSelectModule, AvatarModule, MenuModule,
  SkeletonModule, MessageModule, ProgressBarModule, FileUploadModule,
  TabsModule, ToggleSwitchModule, IconFieldModule, InputIconModule,
];

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ...PRIMENG],
  exports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ...PRIMENG],
})
export class SharedModule {}
