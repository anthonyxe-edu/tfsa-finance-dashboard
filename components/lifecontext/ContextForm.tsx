"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Plane } from "lucide-react";
import { setKV, KV_KEYS } from "@/lib/db";
import { useKV } from "@/hooks/useDb";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { uid, fmtMonthLabel, fmtCurrency0 } from "@/lib/format";
import {
  DEFAULT_LIFE_CONTEXT,
  type LifeContext,
  type PlannedVacation,
} from "@/lib/types";

export function ContextForm() {
  const ctx = useKV<LifeContext>(KV_KEYS.lifeContext, DEFAULT_LIFE_CONTEXT);

  const [shared, setShared] = useState("");
  const [buffer, setBuffer] = useState("");
  const [vLabel, setVLabel] = useState("");
  const [vMonth, setVMonth] = useState("");
  const [vAmount, setVAmount] = useState("");

  useEffect(() => {
    setShared(ctx.monthlySharedCosts ? String(ctx.monthlySharedCosts) : "");
    setBuffer(ctx.emergencyBufferTarget ? String(ctx.emergencyBufferTarget) : "");
  }, [ctx.monthlySharedCosts, ctx.emergencyBufferTarget]);

  async function update(next: Partial<LifeContext>) {
    await setKV(KV_KEYS.lifeContext, { ...ctx, ...next });
  }

  async function addVacation() {
    if (!vLabel.trim() || !vMonth) return;
    const v: PlannedVacation = {
      id: uid(),
      label: vLabel.trim(),
      month: vMonth,
      amount: parseFloat(vAmount) || 0,
    };
    await update({ plannedVacations: [...ctx.plannedVacations, v] });
    setVLabel("");
    setVMonth("");
    setVAmount("");
  }

  async function removeVacation(id: string) {
    await update({
      plannedVacations: ctx.plannedVacations.filter((v) => v.id !== id),
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Family status" htmlFor="lc-family">
          <Select
            id="lc-family"
            value={ctx.familyStatus}
            onChange={(e) => update({ familyStatus: e.target.value })}
          >
            <option value="single">Single</option>
            <option value="partnered">Partnered</option>
            <option value="married">Married</option>
            <option value="kids">Family with kids</option>
          </Select>
        </Field>
        <Field label="Partner / shared finances" htmlFor="lc-partner">
          <Select
            id="lc-partner"
            value={ctx.hasPartner ? "yes" : "no"}
            onChange={(e) => update({ hasPartner: e.target.value === "yes" })}
          >
            <option value="no">No</option>
            <option value="yes">Yes — girlfriend / partner</option>
          </Select>
        </Field>
        <Field
          label="Monthly shared costs ($)"
          htmlFor="lc-shared"
          hint="Rent split, groceries, subscriptions you share"
        >
          <Input
            id="lc-shared"
            type="number"
            min="0"
            value={shared}
            onChange={(e) => setShared(e.target.value)}
            onBlur={() =>
              update({ monthlySharedCosts: parseFloat(shared) || 0 })
            }
            placeholder="800"
          />
        </Field>
        <Field
          label="Emergency buffer target ($)"
          htmlFor="lc-buffer"
          hint="What a healthy safety net looks like for you"
        >
          <Input
            id="lc-buffer"
            type="number"
            min="0"
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            onBlur={() =>
              update({ emergencyBufferTarget: parseFloat(buffer) || 0 })
            }
            placeholder="10000"
          />
        </Field>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-muted">
          Planned vacations &amp; big expenses
        </h3>
        {ctx.plannedVacations.length > 0 && (
          <ul className="mb-3 space-y-2">
            {[...ctx.plannedVacations]
              .sort((a, b) => a.month.localeCompare(b.month))
              .map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Plane size={14} className="text-info" />
                    <span className="text-fg">{v.label}</span>
                    <span className="text-faint">
                      · {fmtMonthLabel(v.month)} · {fmtCurrency0(v.amount)}
                    </span>
                  </span>
                  <button
                    onClick={() => removeVacation(v.id)}
                    aria-label={`Remove ${v.label}`}
                    className="cursor-pointer text-faint transition-colors hover:text-loss"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
          <Field label="Label" htmlFor="v-label">
            <Input
              id="v-label"
              value={vLabel}
              onChange={(e) => setVLabel(e.target.value)}
              placeholder="Italy trip"
            />
          </Field>
          <Field label="Month" htmlFor="v-month">
            <Input
              id="v-month"
              type="month"
              value={vMonth}
              onChange={(e) => setVMonth(e.target.value)}
            />
          </Field>
          <Field label="Cost ($)" htmlFor="v-amount">
            <Input
              id="v-amount"
              type="number"
              min="0"
              value={vAmount}
              onChange={(e) => setVAmount(e.target.value)}
              placeholder="2000"
            />
          </Field>
          <Button type="button" variant="secondary" onClick={addVacation}>
            <Plus size={16} /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
