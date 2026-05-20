import { Component, inject, input, output, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CommentsService } from '../../services/comments.service';
import { Comment } from '../../../../core/models/comment.model';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [Button, ConfirmDialog],
  providers: [ConfirmationService],
  templateUrl: './comment-list.component.html',
})
export class CommentListComponent {
  private readonly commentsService = inject(CommentsService);
  private readonly confirmationService = inject(ConfirmationService);

  comments = input.required<Comment[]>();
  commentDeleted = output<string>();

  delete(id: string): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este comentario?',
      header: 'Confirmar',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.commentsService
          .remove(id)
          .pipe(tap(() => this.commentDeleted.emit(id)))
          .subscribe();
      },
    });
  }
}
