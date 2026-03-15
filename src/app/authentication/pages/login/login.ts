import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

export interface Feature { label: string; svg: SafeHtml; }

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth      = inject(AuthService);
  private router    = inject(Router);
  private fb        = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  loading  = signal(false);
  error    = signal('');
  showPass = signal(false);
  view     = 'login'; // 'login' | 'recovery'
  year     = new Date().getFullYear();

  private s(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  readonly features: Feature[] = [
    {
      label: 'Estoque de veículos',
      svg: this.s(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10
          s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9
          A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
      </svg>`),
    },
    {
      label: 'Dashboard em tempo real',
      svg: this.s(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>`),
    },
    {
      label: 'Contratos e vendas',
      svg: this.s(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2
          h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`),
    },
    {
      label: 'Agendamentos',
      svg: this.s(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>`),
    },
  ];

  get emailInvalid(): boolean {
    const c = this.form.get('email');
    return !!(c?.invalid && c.touched);
  }

  get passInvalid(): boolean {
    const c = this.form.get('password');
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/']); },
      error: (err) => {
        this.loading.set(false);
        const status = err?.status;
        if (status === 401 || status === 403) this.error.set('E-mail ou senha inválidos.');
        else if (status === 0) this.error.set('Não foi possível conectar ao servidor.');
        else if (status >= 500) this.error.set('Erro interno no servidor. Tente novamente.');
        else this.error.set(err?.error?.message ?? err?.message ?? 'Erro ao realizar login.');
      },
    });
  }
}