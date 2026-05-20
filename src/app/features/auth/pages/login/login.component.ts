import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, InputText, Password, Button],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  loading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (res) => {
        if (res.response !== 'SUCCESS' || !res.data) {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error al iniciar sesión',
            detail: res.message ?? 'Credenciales inválidas',
            life: 4000,
          });
          return;
        }
        this.authService.saveToken(res.data.token);
        this.router.navigate(['/posts']);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al iniciar sesión',
          detail: err.error?.message ?? 'Credenciales inválidas',
          life: 4000,
        });
      },
    });
  }
}
