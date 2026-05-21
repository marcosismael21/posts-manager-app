import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil, tap } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UsersService } from '../../services/users.service';
import { User } from '../../../../core/models/user.model';
import { UserFormModalComponent } from '../../components/user-form-modal/user-form-modal.component';
import { UserDetailModalComponent } from '../../components/user-detail-modal/user-detail-modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [TableModule, Button, InputText, ConfirmDialog, UserFormModalComponent, UserDetailModalComponent],
  providers: [ConfirmationService],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit, OnDestroy {
  private readonly usersService = inject(UsersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  users = signal<User[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  detailVisible = signal(false);
  formVisible = signal(false);
  selectedUser = signal<User | null>(null);

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((term) => this.load(term));

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(search?: string): void {
    this.loading.set(true);
    this.usersService
      .getAll(search)
      .pipe(
        tap((users) => this.users.set(users)),
        finalize(() => this.loading.set(false)),
        catchError(() => of(null)),
      )
      .subscribe();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  openDetail(user: User): void {
    this.selectedUser.set(user);
    this.detailVisible.set(true);
  }

  openCreate(): void {
    this.selectedUser.set(null);
    this.formVisible.set(true);
  }

  openEdit(user: User): void {
    this.selectedUser.set(user);
    this.formVisible.set(true);
  }

  openEditFromDetail(): void {
    this.detailVisible.set(false);
    this.formVisible.set(true);
  }

  onSaved(user: User): void {
    const exists = this.users().some((u) => u._id === user._id);
    if (exists) {
      this.users.update((list) => list.map((u) => (u._id === user._id ? user : u)));
    } else {
      this.users.update((list) => [...list, user]);
    }
  }

  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `¿Eliminar al usuario <strong>${user.name}</strong>? Esta acción no se puede deshacer.`,
      header: 'Eliminar usuario',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.usersService
          .remove(user._id)
          .pipe(
            tap(() => {
              this.users.update((list) => list.filter((u) => u._id !== user._id));
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'Usuario eliminado correctamente',
                life: 3000,
              });
            }),
          )
          .subscribe();
      },
    });
  }
}
