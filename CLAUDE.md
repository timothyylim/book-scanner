# Book Scanner PWA

## Commands

- `npm run dev` — start dev server (with `--host` for LAN access)
- `npm run build` — type-check and build for production
- `npm run preview` — preview production build locally

## Architecture

Vanilla TypeScript + Vite. No framework. All source in `src/`.

### Source Files

- `src/main.ts` — app controller, DOM bindings, event handlers, view switching
- `src/scanner.ts` — camera access and barcode detection using `barcode-detector` polyfill
- `src/isbn.ts` — ISBN validation, ISBN-13 to ISBN-10 conversion, formatting
- `src/openlibrary.ts` — Open Library API client (book lookup, author resolution, cover URLs)
- `src/storage.ts` — IndexedDB persistence via `idb-keyval` for scan history
- `src/style.css` — all styles, supports light/dark via `prefers-color-scheme`
- `src/types.ts` — shared TypeScript interfaces (`ScanRecord`, `BookMetadata`)

### Key Decisions

- **Barcode detection**: Uses the `barcode-detector` npm package which polyfills the native `BarcodeDetector` API. Native on Chrome Android, polyfilled (via ZXing WASM) on iOS Safari.
- **No framework**: vanilla DOM manipulation keeps bundle tiny (~18 KB gzipped)
- **PWA**: configured via `vite-plugin-pwa` in `vite.config.ts`. Service worker auto-generates. Open Library API responses cached with Workbox (`NetworkFirst`), cover images cached with `CacheFirst`.
- **Storage**: `idb-keyval` wrapping IndexedDB. Single key `"scan-history"` stores array of `ScanRecord`.

### Open Library API

- Book lookup: `GET https://openlibrary.org/isbn/{isbn}.json`
- Author resolve: `GET https://openlibrary.org/authors/{key}.json`
- Cover images: `https://covers.openlibrary.org/b/isbn/{isbn}-{S|M|L}.jpg`
- No API key needed. No published rate limit.

## Conventions

- TypeScript strict mode
- No semicolons in imports (Vite default)
- CSS custom properties for theming
