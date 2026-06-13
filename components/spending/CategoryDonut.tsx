"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fmtCurrency0 } from "@/lib/format";

// Lime-led categorical palette, harmonious on the warm-charcoal background.
export const CATEGORY_PALETTE = [
  "#9dff3c", // lime (brand)
  "#2dd4bf", // teal
  "#f59e0b", // amber
  "#fb7185", // rose
  "#a78bfa", // violet
  "#38bdf8", // sky
  "#fbbf24", // gold
  "#34d399", // emerald
  "#f472b6", // pink
  "#c4e64a", // muted lime
  "#5eead4", // light teal
  "#818cf8", // indigo
];

type Slice = { name: string; value: number };

function DonutTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: readonly { name?: unknown; value?: unknown }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const val = Number(p.value ?? 0);
  const pct = total ? (val / total) * 100 : 0;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-fg">{String(p.name ?? "")}</div>
      <div className="text-muted tnum">
        {fmtCurrency0(val)} · {pct.toFixed(1)}%
      </div>
    </div>
  );
}

export function CategoryDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!data.length) return null;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <DonutTooltip active={active} payload={payload} total={total} />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted">Total</span>
          <span className="text-lg font-semibold text-fg tnum">
            {fmtCurrency0(total)}
          </span>
        </div>
      </div>
      <ul className="grid flex-1 grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
        {data.map((d, i) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
                }}
              />
              <span className="truncate text-muted">{d.name}</span>
            </span>
            <span className="text-fg tnum">{fmtCurrency0(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
