/** Minimal CSV parser that handles quoted fields, escaped quotes, and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Normalize common date formats to ISO yyyy-mm-dd. Returns null if unparseable. */
export function normalizeDate(input: string): string | null {
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/);
  if (m) {
    const [, a, b, c] = m;
    if (a.length === 4) {
      return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
    }
    const yyyy = c.length === 2 ? `20${c}` : c;
    return `${yyyy}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
