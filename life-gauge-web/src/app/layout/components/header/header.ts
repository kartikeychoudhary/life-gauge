import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() sidebarCollapsed = false;
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  constructor(public authService: AuthService) {}

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  get userInitials(): string {
    const name = this.currentUser?.name || '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
