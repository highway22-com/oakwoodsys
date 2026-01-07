import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { username, password } = this.loginForm.value;

    // Use /api/auth for local development, /.netlify/functions/auth for production
    const authUrl = '/api/auth';

    this.http.post<{ success: boolean; token?: string; message?: string }>(authUrl, {
      username,
      password
    }, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response) => {
        if (response.success && response.token) {
          // Store token in localStorage
          localStorage.setItem('admin_token', response.token);
          localStorage.setItem('admin_user', username);
          // Redirect to home page
          this.router.navigate(['/']);
        } else {
          this.error.set(response.message || 'Invalid credentials');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.error.set(error.error?.message || 'Login failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
