import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  llmForm: FormGroup;

  profileLoading = false;
  passwordLoading = false;
  llmLoading = false;
  hasApiKey = false;
  showApiKeyField = false;
  useCustomModel = false;

  llmModelOptions = [
    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    const user = this.authService.getCurrentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [user?.email || '', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.llmForm = this.fb.group({
      llm_model: ['gemini-2.0-flash'],
      llm_api_key: [''],
    });
  }

  ngOnInit(): void {
    this.userService.getSettings().subscribe({
      next: (s) => {
        this.hasApiKey = s.has_api_key;
        const isKnown = this.llmModelOptions.some(o => o.value === s.llm_model);
        this.useCustomModel = !!s.llm_model && !isKnown;
        this.llmForm.patchValue({ llm_model: s.llm_model });
        this.cdr.detectChanges();
      },
    });
  }

  toggleCustomModel(): void {
    this.useCustomModel = !this.useCustomModel;
    if (!this.useCustomModel) {
      this.llmForm.patchValue({ llm_model: this.llmModelOptions[0].value });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileLoading = true;
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.profileLoading = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated' });
      },
      error: (err) => {
        this.profileLoading = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Update failed' });
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    this.passwordLoading = true;
    this.userService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordForm.reset();
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Password changed' });
      },
      error: (err) => {
        this.passwordLoading = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Change failed' });
      },
    });
  }

  saveLlm(): void {
    this.llmLoading = true;
    const payload: { llm_model?: string; llm_api_key?: string } = {
      llm_model: this.llmForm.value.llm_model,
    };
    if (this.showApiKeyField && this.llmForm.value.llm_api_key) {
      payload.llm_api_key = this.llmForm.value.llm_api_key;
    }
    this.userService.updateSettings(payload).subscribe({
      next: (s) => {
        this.llmLoading = false;
        this.hasApiKey = s.has_api_key;
        this.showApiKeyField = false;
        this.llmForm.patchValue({ llm_api_key: '' });
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'LLM settings updated' });
      },
      error: (err) => {
        this.llmLoading = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Save failed' });
      },
    });
  }
}
