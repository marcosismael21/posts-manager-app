import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, throwError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiPaginatedResponse, ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import { CreatePostDto, Post, UpdatePostDto } from '../../../core/models/post.model';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/posts`;

  getAll(params?: { page?: number; limit?: number }): Observable<PaginatedData<Post>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<ApiPaginatedResponse<Post>>(this.BASE, { params: httpParams }).pipe(
      map((res) => res.data!),
      catchError((err) => throwError(() => err)),
    );
  }

  getMyPosts(userId: string, page: number, limit: number): Observable<PaginatedData<Post>> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiPaginatedResponse<Post>>(this.BASE, { params }).pipe(
      map((res) => res.data!),
      catchError((err) => throwError(() => err)),
    );
  }

  getOne(id: string): Observable<Post> {
    return this.http.get<ApiResponse<Post>>(`${this.BASE}/${id}`).pipe(
      map((res) => res.data!),
      catchError((err) => throwError(() => err)),
    );
  }

  create(formData: FormData): Observable<Post> {
    return this.http.post<ApiResponse<Post>>(this.BASE, formData).pipe(
      map((res) => res.data!),
      catchError((err) => throwError(() => err)),
    );
  }

  update(id: string, formData: FormData): Observable<Post> {
    return this.http.put<ApiResponse<Post>>(`${this.BASE}/${id}`, formData).pipe(
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

  bulkCreate(dtos: CreatePostDto[]): Observable<Post[]> {
    return this.http.post<ApiResponse<Post[]>>(`${this.BASE}/bulk`, dtos).pipe(
      map((res) => res.data ?? []),
      catchError((err) => throwError(() => err)),
    );
  }

  streamChanges(): Observable<void> {
    return new Observable<void>((observer) => {
      const source = new EventSource(`${this.BASE}/events`);
      source.onmessage = () => observer.next();
      source.onerror = () => observer.error(new Error('SSE connection lost'));
      return () => source.close();
    });
  }
}
