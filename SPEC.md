# Book Barcode Scanner PWA — Spec

## Overview

A progressive web app that uses the device camera to scan book barcodes (EAN-13) and extract the ISBN. Designed to be fast, offline-capable, and installable on mobile devices.

## Core User Flow

1. User opens the app (or taps "Scan" button)
2. Camera viewfinder activates with a targeting overlay
3. User points camera at a book's barcode
4. App decodes the barcode, extracts the ISBN
5. ISBN is displayed with options to copy, look up, or add to a list

## Features

### MVP

- **Camera-based barcode scanning** — real-time detection via the device camera using a JavaScript barcode library (e.g. [ZXing](https://github.com/nicjansma/zxing-js) or [QuaggaJS](https://github.com/serratus/quaggaJS))
- **EAN-13 / ISBN-13 decoding** — parse the scanned barcode, validate it as an ISBN (prefix `978` or `979`), and format it
- **ISBN-10 conversion** — derive and display the ISBN-10 equivalent when applicable
- **Copy to clipboard** — one-tap copy of the ISBN
- **Scan history** — persist scanned ISBNs locally (IndexedDB or localStorage) with timestamps
- **PWA basics** — service worker, web app manifest, installable to home screen, works offline (scanning works without network)

- **Book metadata lookup** — after scanning, automatically fetch book details from Open Library (see below)

### Nice-to-Have

- **Manual entry fallback** — text input for typing an ISBN if camera scan fails
- **Export list** — export scan history as CSV or JSON
- **Bulk scanning mode** — continuous scanning without dismissing between scans (for cataloging)
- **Haptic/audio feedback** — vibrate or beep on successful scan
- **Dark mode** — respect `prefers-color-scheme`

## Technical Decisions

| Area | Choice | Rationale |
|------|--------|-----------|
| Framework | None (vanilla JS) or Preact | Keep bundle tiny for fast mobile load |
| Barcode lib | `@aspect-build/aspect-barcode` or `zxing-js/library` | Reliable EAN-13 support, works in-browser |
| Camera API | `navigator.mediaDevices.getUserMedia()` | Standard web API, wide support |
| Storage | IndexedDB (via `idb-keyval`) | Simple key-value persistence, works offline |
| Build | Vite | Fast dev server, good PWA plugin ecosystem |
| PWA | `vite-plugin-pwa` | Auto-generates service worker and manifest |

## Open Library Integration

After a successful scan, the app fetches book metadata from the Open Library API. No API key required.

### Endpoints Used

1. **Book by ISBN** — `GET https://openlibrary.org/isbn/{isbn}.json`
   - Returns: title, publishers, publish_date, number_of_pages, covers, authors (as refs)
   - The `authors` field contains keys like `{"key": "/authors/OL1234A"}`, not inline names

2. **Author details** — `GET https://openlibrary.org/authors/{authorKey}.json`
   - Returns: `name`, `bio`, `birth_date`, etc.
   - Needed because the ISBN endpoint only returns author references

3. **Cover images** — `https://covers.openlibrary.org/b/isbn/{isbn}-{size}.jpg`
   - Sizes: `S` (small), `M` (medium), `L` (large)
   - Use `M` for result view, `S` for scan history list

### Lookup Flow

```
Scan barcode
  → GET /isbn/{isbn}.json
  → Parse title, publish_date, number_of_pages, cover IDs
  → For each author key: GET /authors/{key}.json → extract name
  → Build cover URL from ISBN
  → Display result, cache in IndexedDB
```

### Error Handling

- **404 (book not found)** — show ISBN only, with a message "Book not found in Open Library"
- **Network error / offline** — show ISBN only, queue lookup for when connectivity returns
- **Rate limiting** — Open Library has no published rate limit but be respectful; no parallel batch requests

### Cached Metadata

Once fetched, metadata is stored alongside the scan record so it's available offline and doesn't need re-fetching.

## Camera / Scanning Details

- Request rear camera by default (`facingMode: "environment"`)
- Render video stream to a `<video>` element
- Sample frames on a `requestAnimationFrame` loop (or Web Worker for perf)
- Decode using the barcode library against each frame
- On successful decode, pause scanning, show result
- Handle permission denied gracefully with a clear message

## Data Model

```ts
interface ScanRecord {
  id: string          // crypto.randomUUID()
  isbn13: string      // "9780134685991"
  isbn10: string | null // "0134685997"
  scannedAt: string   // ISO 8601 timestamp
  metadata?: BookMetadata
}

interface BookMetadata {
  title: string
  authors: string[]        // ["Robert C. Martin"]
  coverUrl: string         // covers.openlibrary.org URL
  publisher?: string
  publishDate?: string
  pageCount?: number
  openLibraryKey?: string  // "/books/OL1234M" for linking out
}
```

## UI Structure

```
┌─────────────────────────┐
│  Book Scanner      [⋮]  │  ← header with menu
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │                 │   │
│   │  Camera Feed    │   │
│   │                 │   │
│   │   ┌─────────┐   │   │
│   │   │ target  │   │   │  ← scanning overlay
│   │   └─────────┘   │   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
│   [ Scan ]              │  ← start/stop toggle
│                         │
├─────────────────────────┤
│  Recent Scans           │
│  978-0134685991  12:03  │
│  978-0596517748  11:58  │
└─────────────────────────┘
```

## Result View (after scan)

```
┌─────────────────────────┐
│  ┌──────┐               │
│  │cover │  Clean Code   │
│  │image │  Robert C.    │
│  │      │    Martin     │
│  └──────┘               │
│                         │
│  ISBN-13  978-0134685991│
│  ISBN-10  0134685997    │
│  Pages   464            │
│  Published  2008        │
│                         │
│  [Copy ISBN] [Open Library]│
│  [Scan Another]         │
└─────────────────────────┘
```

If metadata lookup fails, falls back to ISBN-only view.

## Constraints

- Must work on iOS Safari 15+ and Chrome Android 90+
- Camera permission is required — no scanning without it
- No server component — fully client-side
- Total bundle size target: < 200 KB gzipped

## Out of Scope

- User accounts / authentication
- Server-side storage or sync
- QR codes or non-book barcodes
- Native app wrappers (Capacitor, etc.)
