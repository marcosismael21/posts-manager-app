import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-20 text-slate-400">
      <i class="pi pi-inbox text-5xl mb-4"></i>
      <p class="text-base font-medium">{{ message() }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  message = input('Sin resultados');
}
