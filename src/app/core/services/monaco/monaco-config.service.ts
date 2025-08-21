import { Injectable } from '@angular/core';
import { NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';

// Type definition for Electron window
interface ElectronWindow extends Window {
  process?: {
    type: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MonacoConfigService {
  private readonly isElectron = this.checkIsElectron();

  /**
   * Check if running in Electron environment
   */
  private checkIsElectron(): boolean {
    const electronWindow = window as ElectronWindow;
    return !!electronWindow?.process?.type;
  }

  /**
   * Get Monaco Editor configuration based on environment
   */
  getMonacoConfig(): NgxMonacoEditorConfig {
    const basePath = this.isElectron ? './assets/monaco' : '/assets/monaco';
    const vsPath = this.isElectron ? './assets/monaco/vs' : '/assets/monaco/vs';

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
