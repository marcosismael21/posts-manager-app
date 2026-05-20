import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  response: string;
  data: { token: string; user: { id: string; name: string; email: string } } | null;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly TOKEN_KEY = 'auth_token';

  private get store(): Storage | null {
    return typeof window !== 'undefined' ? window.localStorage : null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  saveToken(token: string): void {
    this.store?.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return this.store?.getItem(this.TOKEN_KEY) ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): { id: string; email: string; name: string } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  }

  logout(): void {
    this.store?.removeItem(this.TOKEN_KEY);
  }
}
