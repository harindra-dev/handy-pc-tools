import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookmarkService } from '../../core/services/bookmark/bookmark.service';
import { Bookmark, BookmarkFolder } from '../../core/models/bookmark.model';

@Component({
  selector: 'app-bookmark-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookmark-widget.html',
  styleUrl: './bookmark-widget.scss'
})
export class BookmarkWidget {
  private readonly bookmarkService = inject(BookmarkService);

  // Form data
  readonly bookmarkForm = signal({
    title: '',
    url: '',
    folder: '',
    description: ''
  });

  readonly showAddForm = signal(false);
  readonly isLoading = signal(false);
  readonly showCreateFolder = signal(false);
  readonly newFolderName = signal('');

  // Get reactive data
  readonly bookmarks = this.bookmarkService.bookmarksSignal;
  readonly folders = this.bookmarkService.foldersSignal;

  // Display recent bookmarks (limit to 5)
  get recentBookmarks(): Bookmark[] {
    return this.bookmarks().slice(0, 5);
  }

  async onUrlPaste(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    
    if (this.isValidUrl(pastedText)) {
      this.bookmarkForm.update(form => ({ ...form, url: pastedText }));
      
      // Try to extract title from URL if no title is provided
      if (!this.bookmarkForm().title) {
        try {
          const title = await this.extractTitleFromUrl(pastedText);
          this.bookmarkForm.update(form => ({ ...form, title: title || this.getDomainFromUrl(pastedText) }));
        } catch {
          this.bookmarkForm.update(form => ({ ...form, title: this.getDomainFromUrl(pastedText) }));
        }
      }
    } else {
      this.bookmarkForm.update(form => ({ ...form, url: pastedText }));
    }
  }

  async addBookmark(): Promise<void> {
    const form = this.bookmarkForm();
    
    if (!form.title.trim() || !form.url.trim()) {
      return;
    }

    if (!this.isValidUrl(form.url)) {
      alert('Please enter a valid URL');
      return;
    }

    this.isLoading.set(true);

    try {
      const favicon = await this.bookmarkService.getFaviconUrl(form.url);
      
      await this.bookmarkService.addBookmark({
        title: form.title.trim(),
        url: form.url.trim(),
        folder: form.folder || undefined,
        description: form.description.trim() || undefined,
        favicon
      });

      this.resetForm();
    } catch (error) {
      console.error('Error adding bookmark:', error);
      alert('Failed to add bookmark. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async createFolder(): Promise<void> {
    const folderName = this.newFolderName().trim();
    
    if (!folderName) {
      return;
    }

    // Check if folder already exists
    const existingFolder = this.folders().find(f => f.name.toLowerCase() === folderName.toLowerCase());
    if (existingFolder) {
      alert('Folder already exists');
      return;
    }

    try {
      await this.bookmarkService.addFolder(folderName);
      this.newFolderName.set('');
      this.showCreateFolder.set(false);
      
      // Set the newly created folder as selected
      this.bookmarkForm.update(form => ({ ...form, folder: folderName }));
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder. Please try again.');
    }
  }

  async deleteBookmark(bookmark: Bookmark): Promise<void> {
    if (!bookmark.id) return;
    
    if (confirm(`Are you sure you want to delete "${bookmark.title}"?`)) {
      try {
        await this.bookmarkService.deleteBookmark(bookmark.id);
      } catch (error) {
        console.error('Error deleting bookmark:', error);
        alert('Failed to delete bookmark. Please try again.');
      }
    }
  }

  openBookmark(url: string): void {
    window.open(url, '_blank');
  }

  private resetForm(): void {
    this.bookmarkForm.set({
      title: '',
      url: '',
      folder: '',
      description: ''
    });
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
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      const html = data.contents;
      
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : null;
    } catch {
      return null;
    }
  }

  onFolderChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.bookmarkForm.update(form => ({ ...form, folder: target.value }));
  }

  updateFormField(field: keyof ReturnType<typeof this.bookmarkForm>, value: string): void {
    this.bookmarkForm.update(form => ({ ...form, [field]: value }));
  }
}