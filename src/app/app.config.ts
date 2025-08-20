import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  Provider,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  NGX_MONACO_EDITOR_CONFIG,
  NgxMonacoEditorConfig,
} from 'ngx-monaco-editor-v2';

import { routes } from './app.routes';

const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: '/assets/monaco',
  defaultOptions: {
    scrollBeyondLastLine: false,
    automaticLayout: true,
    theme: 'vs-dark',
  },
  requireConfig: {
    paths: {
      vs: '/assets/monaco/vs',
    },
  },
};

// Standalone module configuration
const monacoProviders: Provider[] = [
  { provide: NGX_MONACO_EDITOR_CONFIG, useValue: monacoConfig },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    ...monacoProviders,
  ],
};
