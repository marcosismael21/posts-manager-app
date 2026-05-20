import { Component, input, output, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { Post } from '../../../../core/models/post.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-posts-grid',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [Button, Tag, Paginator, TooltipModule, EmptyStateComponent],
  templateUrl: './posts-grid.component.html',
})
export class PostsGridComponent {
  readonly posts = input.required<Post[]>();
  readonly loading = input(false);
  readonly totalRecords = input(0);
  readonly pageSize = input(10);
  readonly first = input(0);
  readonly showEditDelete = input(true);

  readonly pageChange = output<{ first: number; rows: number }>();
  readonly viewPost = output<string>();
  readonly editPost = output<string>();
  readonly deletePost = output<string>();

  private imageIndices = signal<Record<string, number>>({});

  getIndex(postId: string): number {
    return this.imageIndices()[postId] ?? 0;
  }

  prev(postId: string, total: number, event: Event): void {
    event.stopPropagation();
    this.imageIndices.update((m) => ({
      ...m,
      [postId]: ((m[postId] ?? 0) - 1 + total) % total,
    }));
  }

  next(postId: string, total: number, event: Event): void {
    event.stopPropagation();
    this.imageIndices.update((m) => ({
      ...m,
      [postId]: ((m[postId] ?? 0) + 1) % total,
    }));
  }

  onPageChange(event: PaginatorState): void {
    this.pageChange.emit({ first: event.first ?? 0, rows: event.rows ?? this.pageSize() });
  }
}
