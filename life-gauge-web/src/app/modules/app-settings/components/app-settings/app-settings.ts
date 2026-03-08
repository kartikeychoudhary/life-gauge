import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminUser, TestDefinition } from '../../../../core/models/admin.model';

@Component({
  selector: 'app-settings-page',
  standalone: false,
  templateUrl: './app-settings.html',
  styleUrl: './app-settings.scss',
})
export class AppSettingsPage implements OnInit {
  activeTab = '0';

  // General
  allowSignups = false;
  generalLoading = false;

  // Users
  users: AdminUser[] = [];
  usersLoading = false;
  showAddUserDialog = false;
  addUserForm: FormGroup;
  addUserLoading = false;
  showResetPasswordDialog = false;
  resetPasswordForm: FormGroup;
  resetPasswordLoading = false;
  resetPasswordUserId: number | null = null;

  // Test Definitions
  testDefs: TestDefinition[] = [];
  testDefsLoading = false;
  showAddTestDialog = false;
  addTestForm: FormGroup;
  addTestLoading = false;
  editingTestDef: TestDefinition | null = null;
  showEditTestDialog = false;
  editTestForm: FormGroup;
  editTestLoading = false;

  categoryOptions = [
    { label: 'Hormones & Vitamins', value: 'Hormones & Vitamins' },
    { label: 'Cardiac, Iron & Diabetes', value: 'Cardiac, Iron & Diabetes' },
    { label: 'Lipid Profile', value: 'Lipid Profile' },
    { label: 'Liver, Kidney & Electrolytes', value: 'Liver, Kidney & Electrolytes' },
    { label: 'Hematology', value: 'Hematology' },
    { label: 'Urinalysis', value: 'Urinalysis' },
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.addUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['user'],
    });

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.addTestForm = this.fb.group({
      test_key: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*$/)]],
      display_name: ['', Validators.required],
      category: ['', Validators.required],
      category_order: [0],
      description: [''],
      unit: [''],
      default_ref_min: [null],
      default_ref_max: [null],
    });

    this.editTestForm = this.fb.group({
      test_key: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*$/)]],
      display_name: ['', Validators.required],
      category: ['', Validators.required],
      category_order: [0],
      description: [''],
      unit: [''],
      default_ref_min: [null],
      default_ref_max: [null],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadSettings();
    this.loadUsers();
    this.loadTestDefs();
  }

  // ─── General Tab ───

  loadSettings(): void {
    this.generalLoading = true;
    this.adminService.getAppSettings().subscribe({
      next: (s) => {
        this.allowSignups = s['allow_signups'] === 'true';
        this.generalLoading = false;
      },
      error: () => { this.generalLoading = false; },
    });
  }

  onSignupToggle(): void {
    this.generalLoading = true;
    this.adminService.updateAppSetting('allow_signups', String(this.allowSignups)).subscribe({
      next: () => {
        this.generalLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Signup setting updated' });
      },
      error: () => {
        this.generalLoading = false;
        this.allowSignups = !this.allowSignups;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update setting' });
      },
    });
  }

  // ─── Users Tab ───

  loadUsers(): void {
    this.usersLoading = true;
    this.adminService.listUsers().subscribe({
      next: (users) => { this.users = users; this.usersLoading = false; },
      error: () => { this.usersLoading = false; },
    });
  }

  openAddUser(): void {
    this.addUserForm.reset({ role: 'user' });
    this.showAddUserDialog = true;
  }

  submitAddUser(): void {
    if (this.addUserForm.invalid) return;
    this.addUserLoading = true;
    this.adminService.createUser(this.addUserForm.value).subscribe({
      next: () => {
        this.addUserLoading = false;
        this.showAddUserDialog = false;
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'User created with default password' });
      },
      error: (err) => {
        this.addUserLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create user' });
      },
    });
  }

  toggleRole(user: AdminUser): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Role changed to ${newRole}` });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update role' });
      },
    });
  }

  openResetPassword(user: AdminUser): void {
    this.resetPasswordUserId = user.id;
    this.resetPasswordForm.reset();
    this.showResetPasswordDialog = true;
  }

  submitResetPassword(): void {
    if (this.resetPasswordForm.invalid || !this.resetPasswordUserId) return;
    this.resetPasswordLoading = true;
    this.adminService.resetUserPassword(this.resetPasswordUserId, this.resetPasswordForm.value.password).subscribe({
      next: () => {
        this.resetPasswordLoading = false;
        this.showResetPasswordDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Reset', detail: 'Password reset. User will be prompted to change it on login.' });
      },
      error: (err) => {
        this.resetPasswordLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to reset password' });
      },
    });
  }

  confirmDeleteUser(user: AdminUser): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete user "${user.name}" (${user.email})? This will also delete all their reports and data.`,
      header: 'Delete User',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adminService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsers();
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted' });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to delete user' });
          },
        });
      },
    });
  }

  getRoleSeverity(role: string): 'success' | 'info' {
    return role === 'admin' ? 'success' : 'info';
  }

  // ─── Test Definitions Tab ───

  loadTestDefs(): void {
    this.testDefsLoading = true;
    this.adminService.listTestDefinitions().subscribe({
      next: (defs) => { this.testDefs = defs; this.testDefsLoading = false; },
      error: () => { this.testDefsLoading = false; },
    });
  }

  openAddTest(): void {
    this.addTestForm.reset();
    this.showAddTestDialog = true;
  }

  submitAddTest(): void {
    if (this.addTestForm.invalid) return;
    this.addTestLoading = true;
    this.adminService.createTestDefinition(this.addTestForm.value).subscribe({
      next: () => {
        this.addTestLoading = false;
        this.showAddTestDialog = false;
        this.loadTestDefs();
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Test definition added' });
      },
      error: (err) => {
        this.addTestLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create test' });
      },
    });
  }

  openEditTest(def: TestDefinition): void {
    this.editingTestDef = def;
    this.editTestForm.patchValue({
      test_key: def.test_key,
      display_name: def.display_name,
      category: def.category,
      category_order: def.category_order || 0,
      description: def.description || '',
      unit: def.unit || '',
      default_ref_min: def.default_ref_min,
      default_ref_max: def.default_ref_max,
      is_active: def.is_active,
    });
    this.showEditTestDialog = true;
  }

  submitEditTest(): void {
    if (this.editTestForm.invalid || !this.editingTestDef) return;
    this.editTestLoading = true;
    this.adminService.updateTestDefinition(this.editingTestDef.id, this.editTestForm.value).subscribe({
      next: () => {
        this.editTestLoading = false;
        this.showEditTestDialog = false;
        this.loadTestDefs();
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Test definition updated' });
      },
      error: (err) => {
        this.editTestLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to update test' });
      },
    });
  }

  confirmDeleteTest(def: TestDefinition): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${def.display_name}" (${def.test_key})?`,
      header: 'Delete Test Definition',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adminService.deleteTestDefinition(def.id).subscribe({
          next: () => {
            this.loadTestDefs();
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Test definition deleted' });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to delete' });
          },
        });
      },
    });
  }

  getActiveSeverity(active: boolean): 'success' | 'danger' {
    return active ? 'success' : 'danger';
  }
}
