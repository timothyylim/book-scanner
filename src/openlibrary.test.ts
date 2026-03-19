import { describe, it, expect } from "vitest"
import { lookupBook } from "./openlibrary"

describe("lookupBook", () => {
  it("finds 'All Fours' by ISBN 9781838853488", async () => {
    const result = await lookupBook("9781838853488")
    expect(result).not.toBeNull()
    expect(result!.title).toMatch(/all fours/i)
    expect(result!.authors.length).toBeGreaterThan(0)
    expect(result!.authors.some((a) => /july/i.test(a))).toBe(true)
  }, 15000)

  it("returns null for a non-existent ISBN", async () => {
    const result = await lookupBook("9799999999999")
    expect(result).toBeNull()
  }, 15000)
})
