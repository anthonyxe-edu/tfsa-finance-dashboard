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

/**
 * Bank exports use negative amounts for debits (spending) — so a statement has
 * many negative rows (debits) and few positive ones (deposits). The app's own
 * convention is the opposite (positive = expense). Compare *counts*: if negatives
 * outnumber positives the file is a bank export and expenses should be flipped to
 * positive. (Counts, not sums, so a single big paycheque deposit can't flip it.)
 */
export function isBankSignConvention(amounts: number[]): boolean {
  let pos = 0;
  let neg = 0;
  for (const a of amounts) {
    if (a > 0) pos++;
    else if (a < 0) neg++;
  }
  return neg > pos;
}

/**
 * Stable identity for de-duping imports: same date + amount + name = same txn.
 * Amount is rounded to cents and the name lower-cased/trimmed so trivial
 * differences don't slip a duplicate through. Lets a statement be re-imported
 * safely — already-present rows are skipped.
 */
export function txnFingerprint(date: string, amount: number, name: string): string {
  return `${date}|${Math.round(amount * 100)}|${name.trim().toLowerCase()}`;
}

/**
 * Multiset de-dupe for imports. Keeps every incoming item EXCEPT those that
 * match a copy already stored (by fingerprint). Because it counts copies rather
 * than just presence, genuinely repeated transactions are preserved — two
 * identical same-day purchases both import, and a recurring charge on a new date
 * always imports (different date = different key). Only a true re-import of an
 * already-stored row is dropped. Returns the items to actually add.
 */
export function dedupeNew<T>(
  existingKeys: string[],
  incoming: T[],
  keyOf: (item: T) => string,
): T[] {
  const remaining = new Map<string, number>();
  for (const k of existingKeys) remaining.set(k, (remaining.get(k) ?? 0) + 1);
  const fresh: T[] = [];
  for (const item of incoming) {
    const k = keyOf(item);
    const c = remaining.get(k) ?? 0;
    if (c > 0) {
      remaining.set(k, c - 1); // this incoming row matches an existing copy → skip
      continue;
    }
    fresh.push(item);
  }
  return fresh;
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
