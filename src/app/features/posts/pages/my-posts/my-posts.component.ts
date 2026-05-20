import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PostsService } from '../../services/posts.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Post } from '../../../../core/models/post.model';
import { PostsTableComponent } from '../../components/posts-table/posts-table.component';
import { PostsGridComponent } from '../../components/posts-grid/posts-grid.component';

@Component({
  selector: 'app-my-posts',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [Button, InputText, ConfirmDialog, PostsTableComponent, PostsGridComponent],
  providers: [ConfirmationService],
  templateUrl: './my-posts.component.html',
})
export class MyPostsComponent implements OnInit, OnDestroy {
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  posts = signal<Post[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  bulkLoading = signal(false);
  searchQuery = signal('');
  first = signal(0);
  view = signal<'table' | 'grid'>('table');

  readonly pageSize = 10;

  private userId = '';
  private lastLazyEvent?: TableLazyLoadEvent;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userId = user?.id ?? '';

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => {
          this.searchQuery.set(term);
          this.first.set(0);
          this.lastLazyEvent = undefined;
          this.loadPosts();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this.postsService
      .streamChanges()
      .pipe(
        tap(() => this.loadPosts()),
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPosts(event?: TableLazyLoadEvent | { first: number; rows: number }): void {
    if (event) {
      this.lastLazyEvent = event as TableLazyLoadEvent;
      this.first.set(event.first ?? 0);
    }
    const first = this.lastLazyEvent?.first ?? 0;
    const rows = this.lastLazyEvent?.rows ?? this.pageSize;
    const page = Math.floor(first / rows) + 1;

    this.loading.set(true);
    this.postsService
      .getMyPosts(this.userId, page, rows, this.searchQuery() || undefined)
      .pipe(
        tap((result) => {
          this.posts.set(result.items);
          this.totalRecords.set(result.total);
        }),
        finalize(() => this.loading.set(false)),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  newPost(): void {
    this.router.navigate(['/posts/new']);
  }

  onBulkFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dtos = JSON.parse(e.target?.result as string);
        if (!Array.isArray(dtos)) throw new Error();

        this.bulkLoading.set(true);
        this.postsService
          .bulkCreate(dtos)
          .pipe(
            tap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Carga masiva',
                detail: `${dtos.length} posts insertados`,
                life: 3000,
              });
              this.first.set(0);
              this.lastLazyEvent = undefined;
              this.loadPosts();
            }),
            finalize(() => this.bulkLoading.set(false)),
            catchError(() => of(null)),
          )
          .subscribe();
      } catch {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'El archivo JSON no es válido',
          life: 4000,
        });
      }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }

  viewPost(id: string): void {
    this.router.navigate(['/posts', id]);
  }

  editPost(id: string): void {
    this.router.navigate(['/posts', id, 'edit']);
  }

  deletePost(id: string): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este post?',
      header: 'Eliminar post',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.postsService
          .remove(id)
          .pipe(
            tap(() => {
              this.posts.update((list) => list.filter((p) => p._id !== id));
              this.totalRecords.update((t) => t - 1);
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'Post eliminado correctamente',
                life: 3000,
              });
            }),
          )
          .subscribe();
      },
    });
  }
}
