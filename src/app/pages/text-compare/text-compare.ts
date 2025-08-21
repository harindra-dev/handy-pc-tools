import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import {
  MonacoEditorModule,
  DiffEditorModel,
  NGX_MONACO_EDITOR_CONFIG,
  NgxMonacoEditorConfig,
} from 'ngx-monaco-editor-v2';
import { editor } from 'monaco-editor';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AppUtils } from '../../core/services/app-utils/app-utils';
// import * as path from 'path'; // Removed: not available in browser/Electron renderer
// Use a dynamic import to avoid TypeScript errors in browser/Electron renderer
const ipcRenderer = (window as any).require?.('electron')?.ipcRenderer;

@Component({
  selector: 'app-text-compare',
  standalone: true,
  imports: [MonacoEditorModule, CommonModule],
  templateUrl: './text-compare.html',
  styleUrl: './text-compare.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextCompare implements OnInit {
  isLoading = true;
  hasError = false;
  errorMessage = '';

  options = {
    renderSideBySide: true,
    theme: 'vs',
    automaticLayout: true,
    readOnly: false,
    fontSize: 15, // Set default font size
    minimap: {
      enabled: false,
    },
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
    },
  };

  originalModel: DiffEditorModel = {
    code: 'Type or paste your original text here...',
    language: 'text',
  };

  modifiedModel: DiffEditorModel = {
    code: 'Type or paste your modified text here...',
    language: 'text',
  };

  private diffEditor: editor.IStandaloneDiffEditor | null = null;

  private readonly originalModelChange$ = new Subject<string>();
  private readonly modifiedModelChange$ = new Subject<string>();

  constructor(
    @Inject(NGX_MONACO_EDITOR_CONFIG)
    private readonly monacoConfig: NgxMonacoEditorConfig
  ) {}

  ngOnInit() {
    console.log('[TextCompare] Starting Monaco initialization');

    // Check if we're in Electron environment
    const isElectron = this.checkIsElectron();

    if (isElectron) {
      // For Electron, load Monaco manually with proper error handling
      this.loadMonacoForElectron();
    } else {
      // For web, let ngx-monaco-editor handle it automatically
      console.log('[TextCompare] Using automatic Monaco loading for web');
    }

    // Set up the debounced model updates
    this.originalModelChange$.pipe(debounceTime(300)).subscribe((value) => {
      this.updateOriginalModel(value);
    });

    this.modifiedModelChange$.pipe(debounceTime(300)).subscribe((value) => {
      this.updateModifiedModel(value);
    });
  }

  private loadMonacoForElectron(): void {
    console.log('[TextCompare] Loading Monaco manually for Electron');

    // Check if Monaco is already loaded
    if ((window as any).monaco) {
      console.log('[TextCompare] Monaco already available');
      this.isLoading = false;
      this.hasError = false;
      return;
    }

    // Check if AMD loader is already available
    if (typeof (window as any).require !== 'undefined') {
      console.log(
        '[TextCompare] AMD loader already available, using it directly'
      );
      this.configureMonacoLoader();
      return;
    }

    // Check if Monaco loader script is already in the DOM
    const existingScript = document.querySelector(
      'script[src*="monaco"][src*="loader.js"]'
    );
    if (existingScript) {
      console.log(
        '[TextCompare] Monaco loader script already exists, waiting for AMD...'
      );
      this.waitForAMDLoader();
      return;
    }

    try {
      // Create absolute URL for Monaco loader
      const baseUri = document.baseURI || window.location.href;
      const loaderUrl = new URL('assets/monaco/vs/loader.js', baseUri).href;

      console.log(`[TextCompare] Loading Monaco from: ${loaderUrl}`);

      // Load the Monaco loader script
      const script = document.createElement('script');
      script.src = loaderUrl;

      script.onload = () => {
        console.log('[TextCompare] Monaco loader loaded, configuring AMD...');
        this.waitForAMDLoader();
      };

      script.onerror = (error) => {
        console.error('[TextCompare] Failed to load Monaco loader:', error);
        this.handleError('Failed to load Monaco Editor loader');
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('[TextCompare] Error setting up Monaco loader:', error);
      this.handleError('Error initializing Monaco Editor');
    }
  }

  private waitForAMDLoader(): void {
    const maxAttempts = 50;
    let attempts = 0;

    const checkAMD = () => {
      if (typeof (window as any).require !== 'undefined') {
        this.configureMonacoLoader();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkAMD, 100);
      } else {
        console.error('[TextCompare] AMD loader not available after waiting');
        this.handleError('Monaco Editor loader not available');
      }
    };

    checkAMD();
  }

  private configureMonacoLoader(): void {
    try {
      // Wait for AMD loader to be available
      if (typeof (window as any).require === 'undefined') {
        console.log('[TextCompare] AMD loader not ready, retrying...');
        setTimeout(() => this.configureMonacoLoader(), 100);
        return;
      }

      let baseUri = document.baseURI || window.location.href;
      if (this.checkIsElectron()) {
        // Use Electron's require to access path module
        const path = window.require('path');
        const appPath = ipcRenderer.sendSync('get-app-path');
        baseUri = path.join('file://', appPath, 'dist/handy-pc-tools/browser');
      }

      const monacoBase = new URL('assets/monaco', baseUri).href;
      const vsPath = new URL('assets/monaco/vs', baseUri).href;

      console.log(
        `[TextCompare] Configuring AMD with base: ${monacoBase}, vs: ${vsPath}`
      );

      // Configure the AMD loader
      (window as any).require.config({
        baseUrl: monacoBase,
        paths: {
          vs: vsPath,
        },
        waitSeconds: 0,
        timeout: 30000,
      });

      // Load Monaco editor
      (window as any).require(
        ['vs/editor/editor.main'],
        () => {
          console.log('[TextCompare] Monaco editor loaded successfully');
          this.isLoading = false;
          this.hasError = false;
        },
        (error: any) => {
          console.error('[TextCompare] Failed to load Monaco editor:', error);
          this.handleError('Failed to load Monaco Editor');
        }
      );
    } catch (error) {
      console.error('[TextCompare] Error configuring Monaco:', error);
      this.handleError('Error configuring Monaco Editor');
    }
  }

  private checkIsElectron(): boolean {
    const electronWindow = window as any;
    return !!(
      electronWindow?.process?.type ||
      electronWindow?.process?.versions?.electron ||
      navigator.userAgent.toLowerCase().includes('electron')
    );
  }

  private initializeMonacoForElectron(): void {
    console.log('[TextCompare] Initializing Monaco for Electron');

    // Check if Monaco is already loaded
    if ((window as any).monaco) {
      console.log(
        '[TextCompare] Monaco already loaded, using existing instance'
      );
      this.isLoading = false;
      this.hasError = false;
      return;
    }

    // Check if AMD loader already exists
    if (typeof (window as any).require !== 'undefined') {
      console.log('[TextCompare] AMD loader already exists, configuring...');
      this.configureAndLoadMonaco();
      return;
    }

    // Load Monaco loader.js only if not already loaded
    const existingScript = document.querySelector('script[src*="loader.js"]');
    if (existingScript) {
      console.log('[TextCompare] Loader.js already exists, waiting for AMD...');
      this.waitForAMDAndLoad();
      return;
    }

    console.log('[TextCompare] Loading Monaco loader.js for first time');
    const script = document.createElement('script');
    // Use document.baseURI to get proper base path for Electron
    const baseUri = document.baseURI || window.location.href;
    const loaderPath = new URL('assets/monaco/vs/loader.js', baseUri).href;
    script.src = loaderPath;

    console.log(`[TextCompare] Loading Monaco from: ${loaderPath}`);

    script.onload = () => {
      console.log('[TextCompare] Monaco loader.js loaded in Electron');
      this.waitForAMDAndLoad();
    };

    script.onerror = (err) => {
      console.error(
        '[TextCompare] Failed to load Monaco loader.js in Electron:',
        err
      );
      this.handleError('Failed to load Monaco Editor loader');
    };

    document.head.appendChild(script);
  }

  private waitForAMDAndLoad(): void {
    const maxAttempts = 50;
    let attempts = 0;

    const checkAMD = () => {
      if (typeof (window as any).require !== 'undefined') {
        this.configureAndLoadMonaco();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkAMD, 100);
      } else {
        this.handleError('AMD loader not available after loading script');
      }
    };

    checkAMD();
  }

  private configureAndLoadMonaco(): void {
    try {
      console.log('[TextCompare] Configuring AMD loader for Monaco');

      // Get proper base URLs for Electron
      const baseUri = document.baseURI || window.location.href;
      const monacoBase = new URL('assets/monaco', baseUri).href;
      const vsPath = new URL('assets/monaco/vs', baseUri).href;

      console.log(
        `[TextCompare] Monaco base: ${monacoBase}, VS path: ${vsPath}`
      );

      // Reset any existing configuration to avoid conflicts
      if ((window as any).require.config) {
        (window as any).require.config({
          baseUrl: monacoBase,
          paths: {
            vs: vsPath,
          },
          waitSeconds: 0,
          timeout: 30000,
        });
      }

      (window as any).require(
        ['vs/editor/editor.main'],
        () => {
          console.log('[TextCompare] Monaco editor.main loaded in Electron');
          this.isLoading = false;
          this.hasError = false;
        },
        (err: any) => {
          console.error(
            '[TextCompare] Failed to load Monaco in Electron:',
            err
          );
          this.handleError(
            'Failed to load Monaco Editor in Electron environment'
          );
        }
      );
    } catch (error) {
      console.error('[TextCompare] Error configuring Monaco:', error);
      this.handleError('Error configuring Monaco Editor');
    }
  }

  private initializeMonacoForWeb(): void {
    console.log('[TextCompare] Initializing Monaco for Web');

    // Ensure Monaco is initialized with retry and timeout for web
    const maxRetries = 50;
    const retryInterval = 200;
    let retryCount = 0;

    const checkLoader = () => {
      if (typeof (window as any).require !== 'undefined') {
        (window as any).require.config(this.monacoConfig.requireConfig);
        (window as any).require(['vs/editor/editor.main'], () => {
          console.log('[TextCompare] Monaco loaded for web');
          this.isLoading = false;
          this.hasError = false;
        });
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkLoader, retryInterval);
      } else {
        this.handleError(
          'Monaco Editor loader.js took too long to load. Please try refreshing the page.'
        );
      }
    };

    checkLoader();
  }

  private updateOriginalModel(value: string) {
    this.originalModel = { ...this.originalModel, code: value };
  }

  private updateModifiedModel(value: string) {
    this.modifiedModel = { ...this.modifiedModel, code: value };
  }

  onInit(editorInstance: editor.IStandaloneDiffEditor) {
    try {
      this.diffEditor = editorInstance;

      const originalEditor = this.diffEditor.getOriginalEditor();
      const modifiedEditor = this.diffEditor.getModifiedEditor();

      // Ensure both editors are editable
      originalEditor.updateOptions({ readOnly: false });
      modifiedEditor.updateOptions({ readOnly: false });

      originalEditor.onDidChangeModelContent(() => {
        if (originalEditor) {
          this.originalModelChange$.next(originalEditor.getValue());
        }
      });

      modifiedEditor.onDidChangeModelContent(() => {
        if (modifiedEditor) {
          this.modifiedModelChange$.next(modifiedEditor.getValue());
        }
      });

      // Editor is ready
      this.isLoading = false;
      this.hasError = false;
    } catch (error) {
      this.handleError('An error occurred while initializing the editor');
      console.error('Editor initialization error:', error);
    }
  }

  private handleError(message: string) {
    this.hasError = true;
    this.errorMessage = `${message}. Please try refreshing the page.`;
    this.isLoading = false;
  }
}
