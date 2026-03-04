/** Check if an EAN-13 barcode is a valid ISBN (starts with 978 or 979) */
export function isISBN(ean13: string): boolean {
  return /^97[89]\d{10}$/.test(ean13);
}

/** Convert ISBN-13 to ISBN-10. Only works for 978-prefix ISBNs. */
export function isbn13to10(isbn13: string): string | null {
  if (!isbn13.startsWith("978")) return null;

  const body = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(body[i]) * (10 - i);
  }
  const remainder = (11 - (sum % 11)) % 11;
  const check = remainder === 10 ? "X" : String(remainder);
  return body + check;
}

/** Format ISBN-13 with hyphens: 978-0-13-468599-1 */
export function formatISBN13(isbn: string): string {
  // Simplified formatting — just groups the prefix
  return `${isbn.slice(0, 3)}-${isbn.slice(3)}`;
}
