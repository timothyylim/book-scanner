import type { BookMetadata } from "./types";

interface OLBookResponse {
  title?: string;
  authors?: { key: string }[];
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  covers?: number[];
  key?: string;
}

interface OLAuthorResponse {
  name?: string;
}

export async function lookupBook(isbn: string): Promise<BookMetadata | null> {
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
  if (!res.ok) return null;

  const data: OLBookResponse = await res.json();

  // Resolve author names in parallel
  const authorKeys = data.authors?.map((a) => a.key) ?? [];
  const authorNames = await Promise.all(
    authorKeys.map(async (key) => {
      try {
        const r = await fetch(`https://openlibrary.org${key}.json`);
        if (!r.ok) return "Unknown Author";
        const author: OLAuthorResponse = await r.json();
        return author.name ?? "Unknown Author";
      } catch {
        return "Unknown Author";
      }
    })
  );

  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

  return {
    title: data.title ?? "Unknown Title",
    authors: authorNames.length > 0 ? authorNames : ["Unknown Author"],
    coverUrl,
    publisher: data.publishers?.[0],
    publishDate: data.publish_date,
    pageCount: data.number_of_pages,
    openLibraryKey: data.key,
  };
}
