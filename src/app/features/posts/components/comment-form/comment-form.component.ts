import { Component, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { catchError, finalize, of, tap } from 'rxjs';
import { EditorModule } from 'primeng/editor';
import { Button } from 'primeng/button';
import { CommentsService } from '../../services/comments.service';
import { Comment } from '../../../../core/models/comment.model';

function bodyValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const html = (control.value ?? '') as string;
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text ? null : { required: true };
  };
}

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [ReactiveFormsModule, EditorModule, Button],
  templateUrl: './comment-form.component.html',
})
export class CommentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly commentsService = inject(CommentsService);

  postId = input.required<string>();
  commentAdded = output<Comment>();

  saving = signal(false);

  form = this.fb.group({
    body: ['', [Validators.required, bodyValidator()]],
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
        catchError(() => of(null)),
      )
      .subscribe();
  }
}
