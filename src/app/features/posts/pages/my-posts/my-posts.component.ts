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
import { BulkUploadModalComponent } from '../../components/bulk-upload-modal/bulk-upload-modal.component';

@Component({
  selector: 'app-my-posts',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [Button, InputText, ConfirmDialog, PostsTableComponent, PostsGridComponent, BulkUploadModalComponent],
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
  bulkModalVisible = signal(false);
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

  openBulkModal(): void {
    this.bulkModalVisible.set(true);
  }

  onBulkUploaded(): void {
    this.first.set(0);
    this.lastLazyEvent = undefined;
    this.loadPosts();
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
