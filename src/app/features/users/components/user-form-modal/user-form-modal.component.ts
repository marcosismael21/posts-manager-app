import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, tap } from 'rxjs';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { UsersService } from '../../services/users.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [Button, Dialog, InputText, Password, ReactiveFormsModule],
  templateUrl: './user-form-modal.component.html',
})
export class UserFormModalComponent {
  private readonly usersService = inject(UsersService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  visible = input.required<boolean>();
  user = input<User | null>(null);
  closed = output<void>();
  saved = output<User>();

  saving = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get isEditMode(): boolean {
    return !!this.user();
  }

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.form.reset();
        const user = this.user();
        if (user) {
          this.form.patchValue({ name: user.name, email: user.email, password: '' });
          this.form.get('password')!.setValidators([Validators.minLength(6)]);
        } else {
          this.form.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
        }
        this.form.get('password')!.updateValueAndValidity();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.value;
    const dto = { name: name!, email: email!, password: password! };

    this.saving.set(true);
    const save$ = this.isEditMode
      ? this.usersService.update(this.user()!._id, dto)
      : this.usersService.create(dto);

    save$.pipe(
      tap((user) => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode ? 'Actualizado' : 'Creado',
          detail: `Usuario ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
          life: 3000,
        });
        this.saved.emit(user);
        this.closed.emit();
      }),
      catchError(() => of(null)),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}
