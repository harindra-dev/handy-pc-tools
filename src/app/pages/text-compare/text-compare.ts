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
  private readonly appUtilsService = inject(AppUtils);
  readonly isMonacoLoaderReady = this.appUtilsService.isMonacoLoaderReady;

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
    // Ensure Monaco is initialized
    if (typeof (window as any).require !== 'undefined') {
      (window as any).require.config(this.monacoConfig.requireConfig);
      (window as any).require(['vs/editor/editor.main'], () => {
        this.isLoading = false;
      });
    } else {
      this.handleError('Monaco Editor loader.js is not loaded.');
    }

    // Debounce model updates
    this.originalModelChange$.pipe(debounceTime(300)).subscribe((value) => {
      this.updateOriginalModel(value);
    });

    this.modifiedModelChange$.pipe(debounceTime(300)).subscribe((value) => {
      this.updateModifiedModel(value);
    });
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
