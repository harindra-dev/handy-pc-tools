import { Injectable } from '@angular/core';
import { NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';
import { isElectronApp } from '@app/core/utils/is-electron';

@Injectable({
  providedIn: 'root',
})
export class MonacoConfigService {
  private readonly isElectron = isElectronApp();

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
