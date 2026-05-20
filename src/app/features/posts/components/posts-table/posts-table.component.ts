import { Component, input, output } from '@angular/core';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Post } from '../../../../core/models/post.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-posts-table',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [TableModule, Button, Tag, TooltipModule, EmptyStateComponent],
  templateUrl: './posts-table.component.html',
})
export class PostsTableComponent {
  readonly posts = input.required<Post[]>();
  readonly loading = input(false);
  readonly totalRecords = input(0);
  readonly pageSize = input(10);
  readonly showEditDelete = input(true);

  readonly lazyLoad = output<TableLazyLoadEvent>();
  readonly viewPost = output<string>();
  readonly editPost = output<string>();
  readonly deletePost = output<string>();
}
