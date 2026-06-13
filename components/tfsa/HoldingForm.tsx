"use client";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { uid } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

export function HoldingForm() {
  const [ticker, setTicker] = useState("");
  const [units, setUnits] = useState("");
  const [book, setBook] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;
    await db.etfHoldings.add({
      id: uid(),
      ticker: ticker.trim().toUpperCase(),
      units: parseFloat(units) || 0,
      bookCost: parseFloat(book) || 0,
    });
    setTicker("");
    setUnits("");
    setBook("");
  }

  return (
    <form
      onSubmit={add}
      className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end"
    >
      <Field label="Ticker" htmlFor="h-ticker" hint="TSX uses .TO (e.g. XEQT.TO)">
        <Input
          id="h-ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="XEQT.TO"
          autoComplete="off"
        />
      </Field>
      <Field label="Units" htmlFor="h-units">
        <Input
          id="h-units"
          type="number"
          step="any"
          min="0"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          placeholder="0"
        />
      </Field>
      <Field label="Book cost ($)" htmlFor="h-book">
        <Input
          id="h-book"
          type="number"
          step="any"
          min="0"
          value={book}
          onChange={(e) => setBook(e.target.value)}
          placeholder="0"
        />
      </Field>
      <Button type="submit">
        <Plus size={16} /> Add
      </Button>
    </form>
  );
}
