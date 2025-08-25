import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  ChangeDetectorRef,
  NgZone,
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
// Use a dynamic import to avoid TypeScript errors in browser/Electron renderer
const ipcRenderer = (window as any).require?.('electron')?.ipcRenderer;

interface DiffStats {
  insertions: number;
  deletions: number;
  unchanged: number;
}

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
  diffStats: DiffStats | null = null;
  currentLanguage = 'plaintext';

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
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
  };

  originalModel: DiffEditorModel = {
    code: 'Type or paste your original text here...',
    language: 'plaintext',
  };

  modifiedModel: DiffEditorModel = {
    code: 'Type or paste your modified text here...',
    language: 'plaintext',
  };

  private diffEditor: editor.IStandaloneDiffEditor | null = null;
  private readonly originalModelChange$ = new Subject<string>();
  private readonly modifiedModelChange$ = new Subject<string>();
  private calculateDiffThrottled: any = null;

  constructor(
    @Inject(NGX_MONACO_EDITOR_CONFIG)
    private readonly monacoConfig: NgxMonacoEditorConfig,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
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
      this.calculateDiffStats();
    });

    this.modifiedModelChange$.pipe(debounceTime(300)).subscribe((value) => {
      this.updateModifiedModel(value);
      this.calculateDiffStats();
    });
  }

  copyOriginal() {
    if (this.diffEditor) {
      const originalText = this.diffEditor.getOriginalEditor().getValue();
      navigator.clipboard
        .writeText(originalText)
        .then(() => {
          // Show a success message or toast
          console.log('Original text copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    }
  }

  copyModified() {
    if (this.diffEditor) {
      const modifiedText = this.diffEditor.getModifiedEditor().getValue();
      navigator.clipboard
        .writeText(modifiedText)
        .then(() => {
          // Show a success message or toast
          console.log('Modified text copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    }
  }

  changeLanguage(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select && this.diffEditor) {
      const language = select.value;
      this.currentLanguage = language;

      // Update the models with the new language
      this.updateOriginalModel(
        this.diffEditor.getOriginalEditor().getValue(),
        language
      );
      this.updateModifiedModel(
        this.diffEditor.getModifiedEditor().getValue(),
        language
      );

      // Force a re-render of the editors
      const originalEditor = this.diffEditor.getOriginalEditor();
      const modifiedEditor = this.diffEditor.getModifiedEditor();

      if (originalEditor.getModel() && modifiedEditor.getModel()) {
        (window as any).monaco.editor.setModelLanguage(
          originalEditor.getModel()!,
          language
        );
        (window as any).monaco.editor.setModelLanguage(
          modifiedEditor.getModel()!,
          language
        );
      }
    }
  }

  calculateDiffStats() {
    // If there's already a pending calculation, cancel it
    if (this.calculateDiffThrottled) {
      clearTimeout(this.calculateDiffThrottled);
    }

    // Throttle to avoid excessive calculations
    this.calculateDiffThrottled = setTimeout(() => {
      if (!this.diffEditor) return;

      const originalText = this.diffEditor.getOriginalEditor().getValue();
      const modifiedText = this.diffEditor.getModifiedEditor().getValue();

      if (!originalText && !modifiedText) {
        this.diffStats = { insertions: 0, deletions: 0, unchanged: 0 };
        this.cdr.markForCheck();
        return;
      }

      // Use Monaco's built-in diff algorithm
      this.zone.runOutsideAngular(() => {
        const monacoInstance = (window as any).monaco;

        if (!monacoInstance?.editor) {
          console.error(
            '[TextCompare] Monaco editor not available for diff calculation'
          );
          return;
        }

        const diffComputer = new monacoInstance.editor.DiffComputer(
          originalText.split('\n'),
          modifiedText.split('\n'),
          { maxComputationTime: 1000 }
        );

        const diffResult = diffComputer.computeDiff();

        let insertions = 0;
        let deletions = 0;
        let unchanged = 0;

        // Calculate stats from diff result
        diffResult.changes.forEach((change: any) => {
          if (change.originalLength > 0) {
            deletions += change.originalLength;
          }
          if (change.modifiedLength > 0) {
            insertions += change.modifiedLength;
          }
        });

        // Calculate unchanged lines
        const originalLines = originalText.split('\n').length;
        const modifiedLines = modifiedText.split('\n').length;
        unchanged =
          Math.min(originalLines, modifiedLines) - (insertions + deletions);

        // Ensure unchanged is never negative
        unchanged = Math.max(0, unchanged);

        this.zone.run(() => {
          this.diffStats = { insertions, deletions, unchanged };
          this.cdr.markForCheck();
        });
      });
    }, 500);
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
          this.cdr.markForCheck();
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

  private updateOriginalModel(value: string, language?: string) {
    this.originalModel = {
      ...this.originalModel,
      code: value,
      language: language || this.originalModel.language,
    };
  }

  private updateModifiedModel(value: string, language?: string) {
    this.modifiedModel = {
      ...this.modifiedModel,
      code: value,
      language: language || this.modifiedModel.language,
    };
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

      // Calculate initial diff stats
      this.calculateDiffStats();

      // Editor is ready
      this.isLoading = false;
      this.hasError = false;
      this.cdr.markForCheck();
    } catch (error) {
      this.handleError('An error occurred while initializing the editor');
      console.error('Editor initialization error:', error);
    }
  }

  private handleError(message: string) {
    this.hasError = true;
    this.errorMessage = `${message}. Please try refreshing the page.`;
    this.isLoading = false;
    this.cdr.markForCheck();
  }
}
