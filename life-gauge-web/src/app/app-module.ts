import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CoreModule } from './core-module';
import { LayoutModule } from './layout/layout-module';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const AppTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}', 100: '{blue.100}', 200: '{blue.200}', 300: '{blue.300}',
      400: '{blue.400}', 500: '{blue.500}', 600: '{blue.600}', 700: '{blue.700}',
      800: '{blue.800}', 900: '{blue.900}', 950: '{blue.950}',
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff', 50: '{slate.50}', 100: '{slate.100}', 200: '{slate.200}',
          300: '{slate.300}', 400: '{slate.400}', 500: '{slate.500}', 600: '{slate.600}',
          700: '{slate.700}', 800: '{slate.800}', 900: '{slate.900}', 950: '{slate.950}',
        },
      },
    },
  },
});

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
    AppRoutingModule,
    LayoutModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    MessageService,
    ConfirmationService,
    providePrimeNG({
      theme: {
        preset: AppTheme,
        options: { darkModeSelector: '.app-dark', cssLayer: false },
      },
    }),
  ],
  bootstrap: [App],
})
export class AppModule {}
