import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Comment, CreateCommentDto } from '../../../core/models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/comments`;

  getByPost(postId: string): Observable<Comment[]> {
    return this.http.get<ApiResponse<Comment[]>>(this.BASE, { params: { postId } }).pipe(
      map((res) => res.data ?? []),
      catchError((err) => throwError(() => err)),
    );
  }

  create(dto: CreateCommentDto): Observable<Comment> {
    return this.http.post<ApiResponse<Comment>>(this.BASE, dto).pipe(
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
