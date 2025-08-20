export interface Bookmark {
  id?: string;
  title: string;
  url: string;
  folder?: string;
  favicon?: string;
  description?: string;
  dateCreated: Date;
  dateModified: Date;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  dateCreated: Date;
  bookmarkCount?: number;
}

export interface BookmarkData {
  bookmarks: Bookmark[];
  folders: BookmarkFolder[];
}