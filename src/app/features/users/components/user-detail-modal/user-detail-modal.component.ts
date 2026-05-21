import { Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-detail-modal',
  standalone: true,
  imports: [Button, Dialog],
  templateUrl: './user-detail-modal.component.html',
})
export class UserDetailModalComponent {
  visible = input.required<boolean>();
  user = input<User | null>(null);
  closed = output<void>();
  edit = output<void>();
}
