"use client";
import { useEffect, useState } from "react";
import { Pencil, Check } from "lucide-react";
import { setKV, KV_KEYS } from "@/lib/db";
import { useKV } from "@/hooks/useDb";
import { Money } from "@/components/ui/Money";

export function CashBalanceTile() {
  const balance = useKV<number>(KV_KEYS.checkingBalance, 0);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  useEffect(() => {
    if (!editing) setVal(balance ? String(balance) : "");
  }, [balance, editing]);

  async function commit() {
    await setKV(KV_KEYS.checkingBalance, parseFloat(val) || 0);
    setEditing(false);
  }

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wider text-muted uppercase">
          Chequing balance
        </span>
        <button
          onClick={() => (editing ? commit() : setEditing(true))}
          aria-label={editing ? "Save balance" : "Edit balance"}
          className="cursor-pointer text-faint transition-colors hover:text-fg"
        >
          {editing ? <Check size={15} /> : <Pencil size={14} />}
        </button>
      </div>
      {editing ? (
        <input
          autoFocus
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-2 py-1 text-2xl font-semibold text-fg tnum focus:border-primary focus:outline-none"
          placeholder="0"
        />
      ) : (
        <div className="mt-2 text-2xl font-semibold text-fg tnum">
          <Money value={balance} />
        </div>
      )}
      <div className="mt-1 text-xs text-faint">tap the pencil to update</div>
    </div>
  );
}
