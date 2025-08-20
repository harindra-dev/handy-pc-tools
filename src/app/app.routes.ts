import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about').then((m) => m.About),
  },
  // text-compare
  {
    path: 'text-compare',
    loadComponent: () =>
      import('./text-compare/text-compare').then((m) => m.TextCompare),
  },
  // notes-list
  {
    path: 'notes-list',
    loadComponent: () => import('./notes/notes').then((m) => m.Notes),
  },
  // bookmarks
  {
    path: 'bookmarks',
    loadComponent: () =>
      import('./bookmarks/bookmarks').then((m) => m.Bookmarks),
  },
];
