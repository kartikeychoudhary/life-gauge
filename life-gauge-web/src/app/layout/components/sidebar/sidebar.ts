import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() mobileClose = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/dashboard' },
    { label: 'Health Tests', icon: 'pi pi-file-pdf', route: '/health-tests' },
    { label: 'Settings', icon: 'pi pi-cog', route: '/settings' },
  ];

  constructor(public router: Router, private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }

  onNavClick(): void {
    if (this.mobileOpen) this.mobileClose.emit();
  }
}
