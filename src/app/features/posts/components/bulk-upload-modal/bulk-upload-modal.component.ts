import { Component, computed, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, of, switchMap, tap } from 'rxjs';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { MessageService } from 'primeng/api';
import { PostsService } from '../../services/posts.service';
import { CreatePostDto } from '../../../../core/models/post.model';

function bodyValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const html = (control.value ?? '') as string;
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length >= 10 ? null : { minlength: true };
  };
}

interface DraftPost {
  title: string;
  body: string;
  confirmed: boolean;
  pendingFiles: File[];
  previewUrls: string[];
}

@Component({
  selector: 'app-bulk-upload-modal',
  standalone: true,
  imports: [Dialog, Button, ReactiveFormsModule, InputText, EditorModule],
  templateUrl: './bulk-upload-modal.component.html',
})
export class BulkUploadModalComponent {
  private readonly postsService = inject(PostsService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly visible = input.required<boolean>();
  readonly closed = output<void>();
  readonly uploaded = output<void>();

  step = signal<'import' | 'review'>('import');
  drafts = signal<DraftPost[]>([]);
  currentIndex = signal(0);
  uploading = signal(false);
  showCancelConfirm = signal(false);
  showPartialConfirm = signal(false);

  readonly currentDraft = computed(() => this.drafts()[this.currentIndex()] ?? null);
  readonly confirmedCount = computed(() => this.drafts().filter((d) => d.confirmed).length);
  readonly total = computed(() => this.drafts().length);
  readonly remainingSlots = computed(() =>
    Math.max(0, 10 - (this.currentDraft()?.pendingFiles.length ?? 0)),
  );

  draftForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: ['', [bodyValidator()]],
  });

  downloadTemplate(): void {
    const sample: CreatePostDto[] = [
      { title: 'Título del post 1', body: 'Contenido del primer post...' },
      { title: 'Título del post 2', body: 'Contenido del segundo post...' },
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'plantilla-posts.json';
    a.click();
  }

  onJsonFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
        const valid = parsed.every(
          (item) => typeof item?.title === 'string' && typeof item?.body === 'string',
        );
        if (!valid) throw new Error();
        this.drafts.set(
          parsed.map((item: CreatePostDto) => ({
            title: item.title,
            body: item.body,
            confirmed: false,
            pendingFiles: [],
            previewUrls: [],
          })),
        );
        this.currentIndex.set(0);
        this.step.set('review');
        this.loadCurrentToForm();
      } catch {
        this.messageService.add({
          severity: 'error',
          summary: 'JSON inválido',
          detail: 'El archivo debe ser un array de objetos con title y body',
          life: 4000,
        });
      }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }

  prev(): void {
    this.saveFormToCurrent();
    this.currentIndex.update((i) => Math.max(0, i - 1));
    this.loadCurrentToForm();
  }

  next(): void {
    this.saveFormToCurrent();
    this.currentIndex.update((i) => Math.min(this.total() - 1, i + 1));
    this.loadCurrentToForm();
  }

  toggleConfirm(): void {
    this.saveFormToCurrent();
    this.drafts.update((list) =>
      list.map((d, i) =>
        i === this.currentIndex() ? { ...d, confirmed: !d.confirmed } : d,
      ),
    );
  }

  onImageFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(
      (f) => f.type.startsWith('image/') && f.size <= 6 * 1024 * 1024,
    );
    this.drafts.update((list) =>
      list.map((d, i) => {
        if (i !== this.currentIndex()) return d;
        const newFiles = [...d.pendingFiles, ...files].slice(0, 10);
        return { ...d, pendingFiles: newFiles, previewUrls: newFiles.map((f) => URL.createObjectURL(f)) };
      }),
    );
    input.value = '';
  }

  removeImage(imgIndex: number): void {
    this.drafts.update((list) =>
      list.map((d, i) => {
        if (i !== this.currentIndex()) return d;
        const newFiles = d.pendingFiles.filter((_, fi) => fi !== imgIndex);
        return { ...d, pendingFiles: newFiles, previewUrls: newFiles.map((f) => URL.createObjectURL(f)) };
      }),
    );
  }

  requestUpload(): void {
    this.saveFormToCurrent();
    if (this.confirmedCount() < this.total()) {
      this.showPartialConfirm.set(true);
    } else {
      this.doUpload();
    }
  }

  doUpload(): void {
    this.showPartialConfirm.set(false);
    const confirmed = this.drafts().filter((d) => d.confirmed);
    const dtos = confirmed.map((d) => ({ title: d.title, body: d.body }));

    this.uploading.set(true);
    this.postsService
      .bulkCreate(dtos)
      .pipe(
        switchMap((createdPosts) => {
          const imageUpdates = createdPosts
            .map((post, i) => ({ post, files: confirmed[i].pendingFiles }))
            .filter(({ files }) => files.length > 0)
            .map(({ post, files }) => {
              const fd = new FormData();
              fd.append('title', post.title);
              fd.append('body', post.body);
              files.forEach((f) => fd.append('images', f));
              return this.postsService.update(post._id, fd);
            });
          return imageUpdates.length ? forkJoin(imageUpdates) : of([]);
        }),
        tap(() => {
          const n = confirmed.length;
          this.messageService.add({
            severity: 'success',
            summary: 'Carga masiva',
            detail: `${n} post${n !== 1 ? 's' : ''} subido${n !== 1 ? 's' : ''} correctamente`,
            life: 3000,
          });
          this.uploaded.emit();
          this.closeClean();
        }),
        catchError(() => of(null)),
        finalize(() => this.uploading.set(false)),
      )
      .subscribe();
  }

  requestClose(): void {
    if (this.drafts().length === 0) {
      this.closeClean();
      return;
    }
    this.showCancelConfirm.set(true);
  }

  closeClean(): void {
    this.step.set('import');
    this.drafts.set([]);
    this.currentIndex.set(0);
    this.draftForm.reset();
    this.showCancelConfirm.set(false);
    this.showPartialConfirm.set(false);
    this.closed.emit();
  }

  private saveFormToCurrent(): void {
    const { title, body } = this.draftForm.value;
    this.drafts.update((list) =>
      list.map((d, i) =>
        i === this.currentIndex()
          ? { ...d, title: title ?? d.title, body: body ?? d.body }
          : d,
      ),
    );
  }

  private loadCurrentToForm(): void {
    const draft = this.drafts()[this.currentIndex()];
    if (draft) {
      this.draftForm.patchValue({ title: draft.title, body: draft.body });
      this.draftForm.markAsUntouched();
    }
  }
}
