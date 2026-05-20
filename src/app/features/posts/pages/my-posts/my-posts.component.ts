import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, tap } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PostsService } from '../../services/posts.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Post } from '../../../../core/models/post.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-posts',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [TableModule, Button, Tag, ConfirmDialog, EmptyStateComponent],
  providers: [ConfirmationService],
  templateUrl: './my-posts.component.html',
})
export class MyPostsComponent implements OnInit {
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  posts = signal<Post[]>([]);
  loading = signal(true);
  totalRecords = signal(0);
  readonly pageSize = 10;

  private userId = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userId = user?.id ?? '';
  }

  loadPosts(event?: TableLazyLoadEvent): void {
    const first = event?.first ?? 0;
    const rows = event?.rows ?? this.pageSize;
    const page = Math.floor(first / rows) + 1;

    this.loading.set(true);
    this.postsService
      .getMyPosts(this.userId, page, rows)
      .pipe(
        tap((result) => {
          this.posts.set(result.items);
          this.totalRecords.set(result.total);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
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
