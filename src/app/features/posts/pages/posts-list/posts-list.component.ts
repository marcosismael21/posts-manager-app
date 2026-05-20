import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tag } from 'primeng/tag';
import { PostsService } from '../../services/posts.service';
import { Post } from '../../../../core/models/post.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [TableModule, Button, InputText, FormsModule, ConfirmDialog, Tag, EmptyStateComponent],
  providers: [ConfirmationService],
  templateUrl: './posts-list.component.html',
})
export class PostsListComponent implements OnInit, OnDestroy {
  private readonly postsService = inject(PostsService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  readonly pageSize = 10;

  posts = signal<Post[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  searchQuery = signal('');
  bulkLoading = signal(false);

  private lastLazyEvent?: TableLazyLoadEvent;

  filteredPosts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.posts();
    return this.posts().filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => this.searchQuery.set(term)),
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

  loadPosts(event?: TableLazyLoadEvent): void {
    if (event) this.lastLazyEvent = event;
    const first = this.lastLazyEvent?.first ?? 0;
    const rows = this.lastLazyEvent?.rows ?? this.pageSize;
    const page = Math.floor(first / rows) + 1;

    this.loading.set(true);
    this.postsService
      .getAll({ page, limit: rows })
      .pipe(
        tap((result) => {
          this.posts.set(result.items);
          this.totalRecords.set(result.total);
          this.searchQuery.set('');
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

  onBulkFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dtos = JSON.parse(e.target?.result as string);
        if (!Array.isArray(dtos)) throw new Error('El archivo debe ser un arreglo JSON');

        this.bulkLoading.set(true);
        this.postsService
          .bulkCreate(dtos)
          .pipe(
            switchMap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Carga masiva',
                detail: `${dtos.length} posts insertados`,
                life: 3000,
              });
              return this.postsService.getAll({ page: 1, limit: this.pageSize });
            }),
            tap((result) => {
              this.posts.set(result.items);
              this.totalRecords.set(result.total);
            }),
            finalize(() => this.bulkLoading.set(false)),
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
}
