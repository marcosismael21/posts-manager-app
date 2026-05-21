import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'posts', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/posts/pages/posts-list/posts-list.component').then(
            (m) => m.PostsListComponent,
          ),
      },
      {
        path: 'posts/new',
        loadComponent: () =>
          import('./features/posts/pages/post-form/post-form.component').then(
            (m) => m.PostFormComponent,
          ),
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () =>
          import('./features/posts/pages/post-form/post-form.component').then(
            (m) => m.PostFormComponent,
          ),
      },
      {
        path: 'posts/:id',
        loadComponent: () =>
          import('./features/posts/pages/post-detail/post-detail.component').then(
            (m) => m.PostDetailComponent,
          ),
      },
      {
        path: 'my-posts',
        loadComponent: () =>
          import('./features/posts/pages/my-posts/my-posts.component').then(
            (m) => m.MyPostsComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/pages/users/users.component').then(
            (m) => m.UsersComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'posts' },
];
