import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppUtils {
  readonly isMonacoLoaderReady = signal(false);

  private readonly http = inject(HttpClient);

  fetchMonacoLoader() {
    return this.http
      .get('/assets/monaco/loader.js', { responseType: 'text' })
      .pipe(
        takeUntilDestroyed(),
        tap(() => this.isMonacoLoaderReady.set(true))
      );
  }
}
