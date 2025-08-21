import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  Bookmark,
  BookmarkFolder,
  BookmarkData,
} from '../../models/bookmark.model';

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  private readonly dbName = 'HandyPcToolsDB';
  private readonly dbVersion = 1;
  private readonly bookmarksStoreName = 'bookmarks';
  private readonly foldersStoreName = 'folders';

  private readonly bookmarksSubject = new BehaviorSubject<Bookmark[]>([]);
  private readonly foldersSubject = new BehaviorSubject<BookmarkFolder[]>([]);

  public bookmarks$ = this.bookmarksSubject.asObservable();
  public folders$ = this.foldersSubject.asObservable();

  // Signals for reactive UI
  public readonly bookmarksSignal = signal<Bookmark[]>([]);
  public readonly foldersSignal = signal<BookmarkFolder[]>([]);

  constructor() {
    this.initializeDatabase().then(() => {
      this.loadBookmarks();
      this.loadFolders();
    });
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create bookmarks store
        if (!db.objectStoreNames.contains(this.bookmarksStoreName)) {
          const bookmarkStore = db.createObjectStore(this.bookmarksStoreName, {
            keyPath: 'id',
            autoIncrement: false,
          });
          bookmarkStore.createIndex('folder', 'folder', { unique: false });
          bookmarkStore.createIndex('created', 'created', { unique: false });
          bookmarkStore.createIndex('lastAccessed', 'lastAccessed', {
            unique: false,
          });
        }

        // Create folders store
        if (!db.objectStoreNames.contains(this.foldersStoreName)) {
          const folderStore = db.createObjectStore(this.foldersStoreName, {
            keyPath: 'id',
            autoIncrement: false,
          });
          folderStore.createIndex('name', 'name', { unique: true });
        }

        console.log('Database setup complete');
      };
    });
  }

  private async getDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Bookmark CRUD Operations
  async addBookmark(
    bookmark: Omit<Bookmark, 'id' | 'created' | 'lastUpdated' | 'lastAccessed'>
  ): Promise<Bookmark> {
    const db = await this.getDatabase();
    const now = new Date();
    const newBookmark: Bookmark = {
      ...bookmark,
      id: this.generateId(),
      created: now,
      lastUpdated: now,
      lastAccessed: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.bookmarksStoreName],
        'readwrite'
      );
      const store = transaction.objectStore(this.bookmarksStoreName);
      const request = store.add(newBookmark);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadBookmarks();
        resolve(newBookmark);
      };
    });
  }

  async updateBookmark(bookmark: Bookmark): Promise<Bookmark> {
    const db = await this.getDatabase();
    const updatedBookmark = {
      ...bookmark,
      lastUpdated: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.bookmarksStoreName],
        'readwrite'
      );
      const store = transaction.objectStore(this.bookmarksStoreName);
      const request = store.put(updatedBookmark);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadBookmarks();
        resolve(updatedBookmark);
      };
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.bookmarksStoreName],
        'readwrite'
      );
      const store = transaction.objectStore(this.bookmarksStoreName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadBookmarks();
        resolve();
      };
    });
  }

  async updateLastAccessed(id: string): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.bookmarksStoreName],
        'readwrite'
      );
      const store = transaction.objectStore(this.bookmarksStoreName);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const bookmark = getRequest.result as Bookmark;
        if (bookmark) {
          bookmark.lastAccessed = new Date();
          const putRequest = store.put(bookmark);

          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => {
            this.loadBookmarks();
            resolve();
          };
        } else {
          resolve();
        }
      };
    });
  }

  async getBookmarksByFolder(folder?: string): Promise<Bookmark[]> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.bookmarksStoreName], 'readonly');
      const store = transaction.objectStore(this.bookmarksStoreName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const bookmarks = request.result as Bookmark[];
        const filtered = folder
          ? bookmarks.filter((b) => b.folder === folder)
          : bookmarks.filter((b) => !b.folder || b.folder === '');
        resolve(filtered);
      };
    });
  }

  // Folder CRUD Operations
  async addFolder(name: string): Promise<BookmarkFolder> {
    const db = await this.getDatabase();
    const newFolder: BookmarkFolder = {
      id: this.generateId(),
      name,
      dateCreated: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.foldersStoreName], 'readwrite');
      const store = transaction.objectStore(this.foldersStoreName);
      const request = store.add(newFolder);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadFolders();
        resolve(newFolder);
      };
    });
  }

  async deleteFolder(id: string): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.foldersStoreName], 'readwrite');
      const store = transaction.objectStore(this.foldersStoreName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadFolders();
        resolve();
      };
    });
  }

  // Utility Methods
  private async loadBookmarks(): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.bookmarksStoreName], 'readonly');
      const store = transaction.objectStore(this.bookmarksStoreName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const bookmarks = request.result as Bookmark[];
        // Sort by last accessed (most recent first)
        bookmarks.sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime()
        );

        this.bookmarksSubject.next(bookmarks);
        this.bookmarksSignal.set(bookmarks);
        resolve();
      };
    });
  }

  private async loadFolders(): Promise<void> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.foldersStoreName], 'readonly');
      const store = transaction.objectStore(this.foldersStoreName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const folders = request.result as BookmarkFolder[];
        folders.sort(
          (a, b) =>
            new Date(b.dateCreated).getTime() -
            new Date(a.dateCreated).getTime()
        );

        this.foldersSubject.next(folders);
        this.foldersSignal.set(folders);
        resolve();
      };
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getFaviconUrl(url: string): Promise<string> {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return '';
    }
  }

  async searchBookmarks(query: string): Promise<Bookmark[]> {
    const bookmarks = this.bookmarksSignal();
    const searchTerm = query.toLowerCase();

    return bookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(searchTerm) ||
        bookmark.url.toLowerCase().includes(searchTerm) ||
        (bookmark.description &&
          bookmark.description.toLowerCase().includes(searchTerm))
    );
  }

  // Export/Import functionality
  async exportBookmarks(): Promise<BookmarkData> {
    return {
      bookmarks: this.bookmarksSignal(),
      folders: this.foldersSignal(),
    };
  }

  async importBookmarks(data: BookmarkData): Promise<void> {
    const db = await this.getDatabase();
    const transaction = db.transaction(
      [this.bookmarksStoreName, this.foldersStoreName],
      'readwrite'
    );

    // Import folders first
    const folderStore = transaction.objectStore(this.foldersStoreName);
    for (const folder of data.folders) {
      await new Promise<void>((resolve, reject) => {
        const request = folderStore.put(folder);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }

    // Import bookmarks
    const bookmarkStore = transaction.objectStore(this.bookmarksStoreName);
    for (const bookmark of data.bookmarks) {
      await new Promise<void>((resolve, reject) => {
        const request = bookmarkStore.put(bookmark);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }

    // Reload data
    await this.loadFolders();
    await this.loadBookmarks();
  }
}
