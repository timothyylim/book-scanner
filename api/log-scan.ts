import type { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { isbn13, isbn10, title, authors } = req.body ?? {}

  console.log(
    JSON.stringify({
      event: "book_scan",
      isbn13,
      isbn10,
      title: title ?? null,
      authors: authors ?? null,
      timestamp: new Date().toISOString(),
    })
  )

  return res.status(200).json({ ok: true })
}
