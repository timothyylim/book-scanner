import type { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { event, isbn13, isbn10, title, authors, error } = req.body ?? {}

  console.log(
    JSON.stringify({
      event: event ?? "book_scan",
      isbn13,
      isbn10,
      title: title ?? null,
      authors: authors ?? null,
      error: error ?? null,
      timestamp: new Date().toISOString(),
    })
  )

  return res.status(200).json({ ok: true })
}
