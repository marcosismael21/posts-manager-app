import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, finalize, switchMap, tap } from 'rxjs';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { PostsService } from '../../services/posts.service';
import { CommentsService } from '../../services/comments.service';
import { Post } from '../../../../core/models/post.model';
import { Comment } from '../../../../core/models/comment.model';
import { CommentFormComponent } from '../../components/comment-form/comment-form.component';
import { CommentListComponent } from '../../components/comment-list/comment-list.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [Button, Divider, CommentFormComponent, CommentListComponent],
  templateUrl: './post-detail.component.html',
})
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postsService = inject(PostsService);
  private readonly commentsService = inject(CommentsService);

  post = signal<Post | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) =>
          combineLatest([
            this.postsService.getOne(params['id']),
            this.commentsService.getByPost(params['id']),
          ]),
        ),
        tap(([post, comments]) => {
          this.post.set(post);
          this.comments.set(comments);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  goBack(): void {
    this.router.navigate(['/posts']);
  }

  editPost(): void {
    this.router.navigate(['/posts', this.post()?._id, 'edit']);
  }

  onCommentAdded(comment: Comment): void {
    this.comments.update((list) => [comment, ...list]);
  }

  onCommentDeleted(id: string): void {
    this.comments.update((list) => list.filter((c) => c._id !== id));
  }
}
