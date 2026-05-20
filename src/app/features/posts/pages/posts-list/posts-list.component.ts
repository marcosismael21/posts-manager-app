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
import { PostsService } from '../../services/posts.service';
import { Post } from '../../../../core/models/post.model';
import { PostsTableComponent } from '../../components/posts-table/posts-table.component';
import { PostsGridComponent } from '../../components/posts-grid/posts-grid.component';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [Button, InputText, PostsTableComponent, PostsGridComponent],
  templateUrl: './posts-list.component.html',
})
export class PostsListComponent implements OnInit, OnDestroy {
  private readonly postsService = inject(PostsService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  readonly pageSize = 10;

  posts = signal<Post[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  searchQuery = signal('');
  first = signal(0);
  view = signal<'table' | 'grid'>('table');

  private lastLazyEvent?: TableLazyLoadEvent;

  ngOnInit(): void {
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
      .getAll({ page, limit: rows, search: this.searchQuery() || undefined })
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

  viewPost(id: string): void {
    this.router.navigate(['/posts', id]);
  }
}
