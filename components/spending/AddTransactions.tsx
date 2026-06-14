"use client";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Plus, Upload, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { uid } from "@/lib/format";
import { parseCsv, normalizeDate, isBankSignConvention } from "@/lib/csv";
import { detectMerchantCategory } from "@/lib/merchants";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { CATEGORIES } from "@/lib/categories";
import { useTransactions } from "@/hooks/useDb";
import type { Txn } from "@/lib/types";

function makeTxn(p: {
  date: string;
  name: string;
  amount: number;
  category: string | null;
}): Txn {
  return {
    id: uid(),
    date: p.date,
    name: p.name,
    merchant: p.name,
    amount: p.amount,
    pfcPrimary: null,
    pfcDetailed: null,
    // Persist the auto-detected category so it flows to the chart/notifications.
    category: p.category ?? detectMerchantCategory(p.name) ?? null,
  };
}

const num = (s: string | undefined): number | null => {
  if (s == null) return null;
  const v = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  return isNaN(v) ? null : v;
};

export function AddTransactions() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState(""); // "" = auto-detect from merchant
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const txns = useTransactions();

  async function add(e: FormEvent) {
    e.preventDefault();
    const amt = Math.abs(parseFloat(amount) || 0);
    if (!desc.trim() || !amt) return;
    await db.transactions.add(
      makeTxn({
        date,
        name: desc.trim(),
        amount: type === "expense" ? amt : -amt,
        category: type === "income" ? "Income" : category || null,
      }),
    );
    setDesc("");
    setAmount("");
    setMsg(null);
  }

  async function resetAll() {
    await db.transactions.clear();
    setConfirmReset(false);
    setMsg("Cleared all transactions.");
  }

  async function onCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      setMsg("That file has no data rows.");
      e.target.value = "";
      return;
    }
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const di = header.findIndex((h) => h.includes("date"));
    const ai = header.findIndex((h) => h.includes("amount"));
    const ni = header.findIndex(
      (h) =>
        h.includes("desc") ||
        h.includes("name") ||
        h.includes("merchant") ||
        h.includes("payee"),
    );
    const ci = header.findIndex((h) => h.includes("categor"));
    const debitI = header.findIndex(
      (h) => h.includes("debit") || h.includes("withdraw"),
    );
    const creditI = header.findIndex(
      (h) => h.includes("credit") || h.includes("deposit"),
    );

    if (di < 0 || (ai < 0 && debitI < 0 && creditI < 0)) {
      setMsg("CSV needs a date column and an amount (or debit/credit) column.");
      e.target.value = "";
      return;
    }

    type Raw = {
      date: string;
      name: string;
      category: string | null;
      raw: number;
      debit: number;
      credit: number;
    };
    const raws: Raw[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const date = normalizeDate(row[di] ?? "");
      if (!date) continue;
      const name = (ni >= 0 ? row[ni] : "")?.trim() || "Transaction";
      const category = ci >= 0 ? (row[ci] ?? "").trim() || null : null;
      const raw = ai >= 0 ? num(row[ai]) : null;
      const debit = debitI >= 0 ? num(row[debitI]) ?? 0 : 0;
      const credit = creditI >= 0 ? num(row[creditI]) ?? 0 : 0;
      if (ai >= 0 && raw == null && debitI < 0 && creditI < 0) continue;
      raws.push({ date, name, category, raw: raw ?? 0, debit, credit });
    }
    if (!raws.length) {
      setMsg("No valid rows found to import.");
      e.target.value = "";
      return;
    }

    // Normalize to the app's convention: positive = expense.
    let note = "";
    let txnsToAdd: Txn[];
    if (debitI >= 0 || creditI >= 0) {
      // Separate debit/credit columns: debit is spend, credit is income.
      txnsToAdd = raws.map((r) =>
        makeTxn({ date: r.date, name: r.name, category: r.category, amount: r.debit - r.credit }),
      );
      note = " · used debit/credit columns";
    } else {
      // Single amount column. Bank exports use negative for debits, so if the
      // negatives outweigh the positives, flip so expenses come out positive.
      const bankFormat = isBankSignConvention(raws.map((r) => r.raw));
      txnsToAdd = raws.map((r) =>
        makeTxn({ date: r.date, name: r.name, category: r.category, amount: bankFormat ? -r.raw : r.raw }),
      );
      if (bankFormat) note = " · detected bank format (negatives = expenses)";
    }

    await db.transactions.bulkAdd(txnsToAdd);
    setMsg(
      `Imported ${txnsToAdd.length} transaction${txnsToAdd.length === 1 ? "" : "s"}${note}.`,
    );
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={add}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_auto] lg:items-end"
      >
        <Field label="Date" htmlFor="t-date">
          <Input
            id="t-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Description" htmlFor="t-desc">
          <Input
            id="t-desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Loblaws"
            autoComplete="off"
          />
        </Field>
        <Field label="Amount ($)" htmlFor="t-amount">
          <Input
            id="t-amount"
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Type" htmlFor="t-type">
          <Select
            id="t-type"
            value={type}
            onChange={(e) => setType(e.target.value as "expense" | "income")}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
        </Field>
        <Field label="Category" htmlFor="t-cat">
          <Select
            id="t-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={type === "income"}
          >
            <option value="">Auto-detect</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">
          <Plus size={16} /> Add
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onCsv}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={15} /> Import CSV
        </Button>
        <span className="text-xs text-faint">
          Columns: date, description, amount (or debit/credit). Sign is
          auto-detected; category is auto-detected from the merchant.
        </span>
        {msg && <span className="text-xs text-gain">{msg}</span>}

        {confirmReset ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">
              Delete all {txns.length} transaction{txns.length === 1 ? "" : "s"}?
            </span>
            <Button type="button" variant="danger" size="sm" onClick={resetAll}>
              Confirm
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmReset(true)}
            disabled={txns.length === 0}
            className="ml-auto text-loss hover:bg-loss/10 hover:text-loss"
          >
            <Trash2 size={15} /> Reset all
          </Button>
        )}
      </div>
    </div>
  );
}
