import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CreateUpdateUserDto, User } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/users`;

  getAll(search?: string): Observable<User[]> {
    const options = search?.trim() ? { params: { search } } : {};
    return this.http.get<ApiResponse<User[]>>(this.BASE, options).pipe(
      map((res) => res.data ?? []),
      catchError((err) => throwError(() => err)),
    );
  }

  create(dto: CreateUpdateUserDto): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.BASE, dto).pipe(
      map((res) => res.data!),
      catchError((err) => throwError(() => err)),
    );
  }

  update(id: string, dto: CreateUpdateUserDto): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.BASE}/${id}`, dto).pipe(
      map((res) => res.data!),
      catchError((err) => throwError(() => err)),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.BASE}/${id}`).pipe(
      map(() => void 0),
      catchError((err) => throwError(() => err)),
    );
  }
}
