"use client";
import { useMemo, useState } from "react";
import { Sparkles, Send, Plus, Check } from "lucide-react";
import { useTransactions, useRules, useGoals, useKV } from "@/hooks/useDb";
import { useIncome } from "@/hooks/useIncome";
import { db, KV_KEYS } from "@/lib/db";
import { monthlyByCategory } from "@/lib/analysis";
import { generatePlan, type Plan } from "@/lib/planner";
import { currentMonth } from "@/lib/format";

type Msg =
  | { role: "user"; text: string }
  | { role: "assistant"; plan: Plan; added?: boolean };

const SUGGESTIONS = [
  "Emergency fund of $10k",
  "Save $4,000 for a trip in 8 months",
  "$25,000 for a car in 2 years",
];

export function GoalPlanner() {
  const txns = useTransactions();
  const rules = useRules();
  const goals = useGoals();
  const manualIncome = useKV<number>(KV_KEYS.monthlyIncome, 0);
  const income = useIncome(currentMonth(), manualIncome).income;

  const avgSpend = useMemo(() => {
    const hist = monthlyByCategory(txns, rules);
    const totals = Object.values(hist).map((m) =>
      Object.values(m).reduce((s, v) => s + v, 0),
    );
    return totals.length ? totals.reduce((s, v) => s + v, 0) / totals.length : 0;
  }, [txns, rules]);

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      plan: {
        title: "What are you saving for?",
        lines: [
          "Type a goal in plain English — like “save $20,000 for a car in 2 years” — and I’ll turn it into a realistic monthly plan from your income and spending.",
        ],
      },
    },
  ]);
  const [input, setInput] = useState("");

  function submit(text: string) {
    const t = text.trim();
    if (!t) return;
    const plan = generatePlan(t, { income, avgSpend, txns, rules, goals });
    setMessages((m) => [...m, { role: "user", text: t }, { role: "assistant", plan }]);
    setInput("");
  }

  async function addGoal(index: number) {
    const msg = messages[index];
    if (msg.role !== "assistant" || !msg.plan.goal) return;
    const g = msg.plan.goal;
    await db.goals.add({ name: g.name, target: g.target, saved: 0, kind: g.kind, deadline: null });
    setMessages((m) =>
      m.map((x, i) => (i === index && x.role === "assistant" ? { ...x, added: true } : x)),
    );
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-3">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm font-medium text-on-primary">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles size={15} />
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface-2 px-3.5 py-2.5">
                <p className="font-title text-sm text-fg">{m.plan.title}</p>
                <div className="mt-1 space-y-1.5">
                  {m.plan.lines.map((l, j) => (
                    <p key={j} className="text-sm leading-relaxed text-muted">
                      {l}
                    </p>
                  ))}
                </div>
                {m.plan.goal &&
                  (m.added ? (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-gain">
                      <Check size={13} /> Added to your goals
                    </span>
                  ) : (
                    <button
                      onClick={() => addGoal(i)}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                    >
                      <Plus size={14} /> Add as a goal
                    </button>
                  ))}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted transition-colors hover:text-fg"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a goal…"
          className="h-11 flex-1 rounded-lg border border-border bg-surface-2 px-3.5 text-sm text-fg placeholder:text-faint focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-on-primary transition-colors hover:bg-primary-strong disabled:opacity-50"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
