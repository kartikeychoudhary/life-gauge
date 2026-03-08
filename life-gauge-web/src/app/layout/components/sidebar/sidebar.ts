import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() mobileClose = new EventEmitter<void>();

  allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/dashboard' },
    { label: 'Health Tests', icon: 'pi pi-file-pdf', route: '/health-tests' },
    { label: 'Settings', icon: 'pi pi-cog', route: '/settings' },
    { label: 'App Settings', icon: 'pi pi-shield', route: '/app-settings', adminOnly: true },
  ];

  navItems: NavItem[] = [];

  constructor(public router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.navItems = this.allNavItems.filter(
        (item) => !item.adminOnly || user?.role === 'admin'
      );
    });
  }

  logout(): void {
    this.authService.logout();
  }

  onNavClick(): void {
    if (this.mobileOpen) this.mobileClose.emit();
  }
}
