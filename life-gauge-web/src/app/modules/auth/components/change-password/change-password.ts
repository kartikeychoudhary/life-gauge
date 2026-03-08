import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    });
  }

  get passwordMismatch(): boolean {
    return (
      this.form.get('new_password')?.value !== this.form.get('confirm_password')?.value &&
      this.form.get('confirm_password')?.touched
    ) as boolean;
  }

  submit(): void {
    if (this.form.invalid || this.passwordMismatch) return;
    this.loading = true;
    this.userService
      .changePassword({
        current_password: this.form.value.current_password,
        new_password: this.form.value.new_password,
      })
      .subscribe({
        next: () => {
          // Update user in local storage to clear force_password_change flag
          const user = this.authService.getCurrentUser();
          if (user) {
            this.authService.updateCurrentUser({ ...user, force_password_change: false });
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Password Changed',
            detail: 'Your password has been updated successfully.',
          });
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to change password',
          });
        },
      });
  }
}
