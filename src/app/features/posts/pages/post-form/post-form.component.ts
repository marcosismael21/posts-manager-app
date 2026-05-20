import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, of, switchMap, tap } from 'rxjs';
import { InputText } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { PostsService } from '../../services/posts.service';

function bodyValidator(min: number): ValidatorFn {
  return (control: AbstractControl) => {
    const html = (control.value ?? '') as string;
    const text = html.replace(/<[^>]*>/g, '').trim();
    if (!text) return { required: true };
    if (text.length < min) return { minlength: true };
    return null;
  };
}

@Component({
  selector: 'app-post-form',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [ReactiveFormsModule, InputText, EditorModule, Button],
  templateUrl: './post-form.component.html',
})
export class PostFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postsService = inject(PostsService);
  private readonly messageService = inject(MessageService);

  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  postId = signal<string | null>(null);
  keepUrls = signal<string[]>([]);
  pendingFiles = signal<File[]>([]);

  previewUrls = computed(() => this.pendingFiles().map((f) => URL.createObjectURL(f)));

  readonly maxFileSize = 6 * 1024 * 1024;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: ['', [bodyValidator(10)]],
  });

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const id = params['id'];
          if (!id) return of(null);
          this.isEditMode.set(true);
          this.postId.set(id);
          this.loading.set(true);
          return this.postsService.getOne(id);
        }),
        tap((post) => {
          if (post) {
            this.form.patchValue({ title: post.title, body: post.body });
            this.keepUrls.set([...post.imageUrls]);
          }
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  get remainingSlots(): number {
    return Math.max(0, 10 - this.keepUrls().length - this.pendingFiles().length);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files).filter(
      (f) => f.size <= this.maxFileSize && f.type.startsWith('image/'),
    );
    const slots = this.remainingSlots;
    this.pendingFiles.update((prev) => [...prev, ...files.slice(0, slots)]);
    input.value = '';
  }

  removeNewFile(index: number): void {
    this.pendingFiles.update((files) => files.filter((_, i) => i !== index));
  }

  removeExistingImage(url: string): void {
    this.keepUrls.update((urls) => urls.filter((u) => u !== url));
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const { title, body } = this.form.value;
    const formData = new FormData();
    formData.append('title', title!);
    formData.append('body', body!);

    if (this.isEditMode()) {
      this.keepUrls().forEach((url) => formData.append('keepUrls', url));
    }
    this.pendingFiles().forEach((file) => formData.append('images', file));

    const save$ = this.isEditMode()
      ? this.postsService.update(this.postId()!, formData)
      : this.postsService.create(formData);

    save$
      .pipe(
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: this.isEditMode() ? 'Actualizado' : 'Creado',
            detail: `Post ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente`,
            life: 3000,
          });
          this.router.navigate(['/posts']);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe();
  }

  cancel(): void {
    this.router.navigate(['/posts']);
  }
}
