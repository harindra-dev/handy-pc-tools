import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BookmarkService } from '../../core/services/bookmark/bookmark.service';
import { Bookmark, BookmarkFolder } from '../../core/models/bookmark.model';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-bookmark-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, ConfirmationDialog],
  templateUrl: './bookmark-widget.html',
  styleUrl: './bookmark-widget.scss',
})
export class BookmarkWidget {
  private readonly bookmarkService = inject(BookmarkService);

  // Form data
  readonly bookmarkForm = signal({
    title: '',
    url: '',
    folder: '',
    description: '',
  });

  readonly showAddForm = signal(false);
  readonly isLoading = signal(false);
  readonly showCreateFolder = signal(false);
  readonly newFolderName = signal('');
  readonly faviconPreview = signal<string>('');

  // Confirmation dialog state
  readonly confirmDialog = signal({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm' as 'confirm' | 'error' | 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    action: null as (() => Promise<void>) | null,
  });

  // URL input debounce subject
  private readonly urlInputSubject = new Subject<string>();

  // Get reactive data
  readonly bookmarks = this.bookmarkService.bookmarksSignal;
  readonly folders = this.bookmarkService.foldersSignal;

  // Display recent bookmarks (limit to 5)
  get recentBookmarks(): Bookmark[] {
    return this.bookmarks().slice(0, 8);
  }

  constructor() {
    // Set up debounced URL input handling with 500ms debounce
    this.urlInputSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(async (url) => {
        await this.handleUrlInput(url);
      });
  }

  // Handle URL input with auto-fetch title and favicon
  async handleUrlInput(url: string): Promise<void> {
    if (!url.trim()) {
      this.faviconPreview.set('');
      return;
    }

    // Only proceed if URL is valid
    if (!this.isValidUrl(url)) {
      this.faviconPreview.set('');
      return;
    }

    // Auto-fetch title and favicon for any valid URL without restrictions
    try {
      // Fetch title and favicon in parallel for better performance
      const [title, favicon] = await Promise.all([
        this.extractTitleFromUrl(url),
        this.bookmarkService.getFaviconUrl(url),
      ]);

      if (title?.trim()) {
        this.bookmarkForm.update((form) => ({
          ...form,
          title: title.trim(),
        }));
      } else {
        // Fallback to domain name if title extraction fails
        const urlDomain = this.getDomainFromUrl(url);
        this.bookmarkForm.update((form) => ({
          ...form,
          title: urlDomain,
        }));
      }

      // Set favicon preview
      if (favicon) {
        this.faviconPreview.set(favicon);
      }
    } catch {
      // Fallback to domain name on error
      const urlDomain = this.getDomainFromUrl(url);
      this.bookmarkForm.update((form) => ({
        ...form,
        title: urlDomain,
      }));

      // Try to get at least a basic favicon
      try {
        const favicon = await this.bookmarkService.getFaviconUrl(url);
        if (favicon) {
          this.faviconPreview.set(favicon);
        }
      } catch {
        this.faviconPreview.set('');
      }
    }
  }

  // Handle URL input changes
  onUrlInput(url: string): void {
    this.bookmarkForm.update((form) => ({ ...form, url }));
    this.urlInputSubject.next(url);
  }

  async onUrlPaste(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';

    // Update URL and trigger auto-fetch
    this.bookmarkForm.update((form) => ({ ...form, url: pastedText }));
    this.urlInputSubject.next(pastedText);
  }

  async addBookmark(): Promise<void> {
    const form = this.bookmarkForm();

    if (!form.title.trim() || !form.url.trim()) {
      return;
    }

    if (!this.isValidUrl(form.url)) {
      this.showErrorDialog('Invalid URL', 'Please enter a valid URL');
      return;
    }

    this.isLoading.set(true);

    try {
      // Use favicon preview if available, otherwise save without favicon initially
      const initialFavicon = this.faviconPreview() || '';

      // Save bookmark immediately for faster saving
      const savedBookmark = await this.bookmarkService.addBookmark({
        title: form.title.trim(),
        url: form.url.trim(),
        folder: form.folder || undefined,
        description: form.description.trim() || undefined,
        favicon: initialFavicon,
      });

      this.resetForm();

      // If we didn't have a favicon preview, fetch it asynchronously after saving
      if (!initialFavicon) {
        this.fetchAndUpdateFavicon(savedBookmark.id!, form.url);
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      this.showErrorDialog(
        'Error',
        'Failed to add bookmark. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // Asynchronously fetch and update favicon after bookmark is saved
  private async fetchAndUpdateFavicon(
    bookmarkId: string,
    url: string
  ): Promise<void> {
    try {
      const favicon = await this.bookmarkService.getFaviconUrl(url);
      if (favicon) {
        await this.bookmarkService.updateBookmarkFavicon(bookmarkId, favicon);
      }
    } catch (error) {
      console.warn('Failed to fetch favicon for bookmark:', error);
      // Don't show error to user since this is a background operation
    }
  }

  async createFolder(): Promise<void> {
    const folderName = this.newFolderName().trim();

    if (!folderName) {
      return;
    }

    // Check if folder already exists
    const existingFolder = this.folders().find(
      (f) => f.name.toLowerCase() === folderName.toLowerCase()
    );
    if (existingFolder) {
      this.showErrorDialog(
        'Folder Exists',
        'A folder with this name already exists'
      );
      return;
    }

    try {
      await this.bookmarkService.addFolder(folderName);
      this.newFolderName.set('');
      this.showCreateFolder.set(false);

      // Set the newly created folder as selected
      this.bookmarkForm.update((form) => ({ ...form, folder: folderName }));
    } catch (error) {
      console.error('Error creating folder:', error);
      this.showErrorDialog(
        'Error',
        'Failed to create folder. Please try again.'
      );
    }
  }

  async deleteBookmark(bookmark: Bookmark): Promise<void> {
    if (!bookmark.id) return;

    this.showConfirmDialog(
      'Delete Bookmark',
      `Are you sure you want to delete "${bookmark.title}"?`,
      'Delete',
      'error',
      async () => {
        try {
          await this.bookmarkService.deleteBookmark(bookmark.id!);
        } catch (error) {
          console.error('Error deleting bookmark:', error);
          this.showErrorDialog(
            'Error',
            'Failed to delete bookmark. Please try again.'
          );
        }
      }
    );
  }

  async openBookmark(bookmark: Bookmark): Promise<void> {
    // Update last accessed timestamp
    if (bookmark.id) {
      try {
        await this.bookmarkService.updateLastAccessed(bookmark.id);
      } catch (error) {
        console.error('Error updating last accessed:', error);
      }
    }

    window.open(bookmark.url, '_blank');
  }

  // Confirmation dialog methods
  private showConfirmDialog(
    title: string,
    message: string,
    confirmText: string = 'Confirm',
    type: 'confirm' | 'error' | 'warning' = 'confirm',
    action: (() => Promise<void>) | null = null
  ): void {
    this.confirmDialog.set({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText: 'Cancel',
      action,
    });
  }

  private showErrorDialog(title: string, message: string): void {
    this.confirmDialog.set({
      isOpen: true,
      title,
      message,
      type: 'error',
      confirmText: 'OK',
      cancelText: '',
      action: null,
    });
  }

  onDialogConfirmed(): void {
    const dialog = this.confirmDialog();
    if (dialog.action) {
      dialog.action();
    }
  }

  onDialogCancelled(): void {
    // Just close the dialog
  }

  onDialogClosed(): void {
    this.confirmDialog.update((dialog) => ({ ...dialog, isOpen: false }));
  }

  private resetForm(): void {
    this.bookmarkForm.set({
      title: '',
      url: '',
      folder: '',
      description: '',
    });
    this.faviconPreview.set('');
  }

  private isValidUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private getDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private async extractTitleFromUrl(url: string): Promise<string | null> {
    // List of CORS proxies in order of preference (fastest first)
    const proxies = [
      // Fastest and most reliable options
      `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`,
      // Fallback options
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${url}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          continue; // Try next proxy
        }

        let html: string;

        // Handle different proxy response formats
        if (proxyUrl.includes('allorigins.win')) {
          const data = await response.json();
          html = data.contents;
        } else if (proxyUrl.includes('codetabs.com')) {
          html = await response.text();
        } else {
          // For most other proxies, response is direct HTML
          html = await response.text();
        }

        // Extract title from the HTML content
        const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
        const titleMatch = titleRegex.exec(html);
        if (titleMatch?.[1]) {
          // Decode HTML entities and clean up the title
          const title = titleMatch[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .trim();

          return title || null;
        }
      } catch (error) {
        // If this proxy fails, continue to the next one
        console.warn(`Proxy failed: ${proxyUrl}`, error);
        continue;
      }
    }

    // If all proxies fail, try one more approach with a meta tag parser
    try {
      return await this.extractTitleFromMetaTags(url);
    } catch {
      console.warn('All title extraction methods failed for URL:', url);
      return null;
    }
  }

  private async extractTitleFromMetaTags(url: string): Promise<string | null> {
    try {
      // Try using a different approach with jsonlink.io API
      const apiUrl = `https://jsonlink.io/api/extract?url=${encodeURIComponent(
        url
      )}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        return data.title || data.og_title || null;
      }
    } catch (error) {
      console.warn('Meta tag extraction failed:', error);
    }

    return null;
  }

  onFolderChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.bookmarkForm.update((form) => ({ ...form, folder: target.value }));
  }

  updateFormField(
    field: keyof ReturnType<typeof this.bookmarkForm>,
    value: string
  ): void {
    this.bookmarkForm.update((form) => ({ ...form, [field]: value }));
  }
}
