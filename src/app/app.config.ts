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
import { provideHttpClient } from '@angular/common/http';
import { MonacoConfigService } from './core/services/monaco/monaco-config.service';

// Type definition for Electron window
interface ElectronWindow extends Window {
  process?: {
    type: string;
    versions?: {
      electron: string;
    };
  };
}

/**
 * Check if running in Electron environment
 */
function checkIsElectron(): boolean {
  const electronWindow = window as ElectronWindow;
  // Check multiple ways to detect Electron
  return !!(
    electronWindow?.process?.type ||
    electronWindow?.process?.versions?.electron ||
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

/**
 * Get Monaco Editor configuration based on environment
 */
function getMonacoConfig(): NgxMonacoEditorConfig {
  const isElectron = checkIsElectron();
  const basePath = isElectron ? './assets/monaco' : '/assets/monaco';
  const vsPath = isElectron ? './assets/monaco/vs' : '/assets/monaco/vs';

  console.log(
    `[Monaco Config] isElectron: ${isElectron}, basePath: ${basePath}, vsPath: ${vsPath}`
  );

  if (isElectron) {
    // For Electron, completely disable automatic loading
    // We'll handle Monaco loading manually in the component
    console.log('[Monaco Config] Disabling automatic loading for Electron');

    return {
      baseUrl: null as any, // Disable automatic loading
      defaultOptions: {
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark',
      },
      requireConfig: null as any, // Disable automatic configuration
      onMonacoLoad: () => {
        console.log('[Monaco Config] Monaco loaded in Electron environment');
      },
    };
  } else {
    // For web, use normal configuration
    return {
      baseUrl: basePath,
      defaultOptions: {
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark',
      },
      requireConfig: {
        paths: {
          vs: vsPath,
        },
      },
    };
  }
}

const monacoConfig = getMonacoConfig();

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
    provideHttpClient(),
  ],
};
