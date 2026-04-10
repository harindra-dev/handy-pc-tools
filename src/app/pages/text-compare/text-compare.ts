import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  ChangeDetectorRef,
  NgZone,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MonacoEditorModule, DiffEditorModel } from 'ngx-monaco-editor-v2';
import { editor } from 'monaco-editor';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { isElectronApp } from '../../core/utils/is-electron';

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
    cursorStyle: 'line' as const,
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

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {}

  ngOnInit() {
    console.log('[TextCompare] Starting Monaco initialization');

    // Check if we're in Electron environment
    const isElectron = isElectronApp();

    if (isElectron) {
      // For Electron, load Monaco manually with proper error handling
      this.loadMonacoForElectron();
    } else {
      // For web, let ngx-monaco-editor handle it automatically.
      // Editor is gated by !isLoading in the template; clear loading so the diff editor mounts
      // and ngx-monaco can initialize (otherwise onInit never runs).
      console.log('[TextCompare] Using automatic Monaco loading for web');
      this.isLoading = false;
      this.cdr.markForCheck();
    }

    // ngx-monaco-diff-editor disposes and recreates the whole editor whenever
    // [originalModel] / [modifiedModel] inputs change — do NOT push typing updates
    // through those bindings. Only refresh diff stats from editor content.
    merge(this.originalModelChange$, this.modifiedModelChange$)
      .pipe(
        debounceTime(400),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.calculateDiffStats());
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

      const originalEditor = this.diffEditor.getOriginalEditor();
      const modifiedEditor = this.diffEditor.getModifiedEditor();
      const monacoGlobal = (window as { monaco?: { editor: { setModelLanguage: (m: editor.ITextModel, id: string) => void } } }).monaco;

      if (originalEditor.getModel() && modifiedEditor.getModel() && monacoGlobal?.editor) {
        monacoGlobal.editor.setModelLanguage(originalEditor.getModel()!, language);
        monacoGlobal.editor.setModelLanguage(modifiedEditor.getModel()!, language);
      }

      // Keep bound models in sync for display without replacing inputs (would recreate editor)
      this.originalModel.language = language;
      this.modifiedModel.language = language;
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

      // Monaco 0.39+ no longer exposes editor.DiffComputer; use line LCS stats instead.
      this.zone.runOutsideAngular(() => {
        const stats = this.computeLineDiffStats(originalText, modifiedText);
        this.zone.run(() => {
          this.diffStats = stats;
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
      if (isElectronApp()) {
        try {
          const w = window as Window & { require?: (m: string) => unknown };
          const pathMod = w.require?.('path') as
            | { join: (...p: string[]) => string }
            | undefined;
          const ipc = w.require?.('electron') as
            | { ipcRenderer?: { sendSync: (c: string) => string } }
            | undefined;
          const ipcRenderer = ipc?.ipcRenderer;
          if (pathMod && ipcRenderer) {
            const appPath = ipcRenderer.sendSync('get-app-path');
            baseUri = pathMod.join('file://', appPath, 'dist/handy-pc-tools/browser');
          }
        } catch {
          // Packaged app path resolution unavailable (e.g. sandboxed renderer); use page base URI
        }
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

  /** Line-based LCS approximation for diff stats (replaces removed Monaco DiffComputer). */
  private computeLineDiffStats(originalText: string, modifiedText: string): DiffStats {
    const ol = originalText.length ? originalText.split('\n') : [];
    const ml = modifiedText.length ? modifiedText.split('\n') : [];
    const n = ol.length;
    const m = ml.length;
    if (n === 0 && m === 0) {
      return { insertions: 0, deletions: 0, unchanged: 0 };
    }
    const dp: number[] = Array(m + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      let prev = 0;
      for (let j = 1; j <= m; j++) {
        const cur = dp[j];
        if (ol[i - 1] === ml[j - 1]) {
          dp[j] = prev + 1;
        } else {
          dp[j] = Math.max(dp[j], dp[j - 1]);
        }
        prev = cur;
      }
    }
    const unchanged = dp[m];
    return {
      insertions: m - unchanged,
      deletions: n - unchanged,
      unchanged,
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

      // Host height overrides apply after first paint; relayout so Monaco fills flex area
      requestAnimationFrame(() => {
        this.diffEditor?.layout();
      });
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
