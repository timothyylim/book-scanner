export interface BookMetadata {
  title: string;
  authors: string[];
  coverUrl: string;
  publisher?: string;
  publishDate?: string;
  pageCount?: number;
  openLibraryKey?: string;
}

export interface ScanRecord {
  id: string;
  isbn13: string;
  isbn10: string | null;
  scannedAt: string;
  metadata?: BookMetadata;
}
