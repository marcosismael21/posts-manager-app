import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, tap } from 'rxjs';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';
import { CommentsService } from '../../services/comments.service';
import { Comment } from '../../../../core/models/comment.model';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [ReactiveFormsModule, Textarea, Button],
  templateUrl: './comment-form.component.html',
})
export class CommentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly commentsService = inject(CommentsService);

  postId = input.required<string>();
  commentAdded = output<Comment>();

  saving = signal(false);

  form = this.fb.group({
    body: ['', [Validators.required, Validators.minLength(10)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.commentsService
      .create({ postId: this.postId(), body: this.form.value.body! })
      .pipe(
        tap((comment) => {
          this.commentAdded.emit(comment);
          this.form.reset();
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe();
  }
}
