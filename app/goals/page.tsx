"use client";
import { Target, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { uid } from "@/lib/format";
import { useGoals } from "@/hooks/useDb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalCard } from "@/components/goals/GoalCard";

export default function GoalsPage() {
  const goals = useGoals();
  const hasEmergency = goals.some((g) => g.kind === "emergency");
  const hasVacation = goals.some((g) => g.kind === "vacation");

  async function seed() {
    if (!hasEmergency)
      await db.goals.add({
        id: uid(),
        name: "Emergency fund",
        target: 10000,
        saved: 0,
        kind: "emergency",
        deadline: null,
      });
    if (!hasVacation)
      await db.goals.add({
        id: uid(),
        name: "Vacation",
        target: 3000,
        saved: 0,
        kind: "vacation",
        deadline: null,
      });
  }

  return (
    <div className="space-y-5">
      <Card title="New goal" subtitle="Track anything you're saving toward">
        <GoalForm />
      </Card>

      {(!hasEmergency || !hasVacation) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-dashed border-border bg-surface/40 px-5 py-4">
          <p className="text-sm text-muted">
            Quick-start the recommended{" "}
            <span className="text-fg">Emergency</span> and{" "}
            <span className="text-fg">Vacation</span> buckets.
          </p>
          <Button variant="secondary" size="sm" onClick={seed}>
            <Sparkles size={15} /> Add buckets
          </Button>
        </div>
      )}

      {goals.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Target size={20} />}
          title="No goals yet"
          description="Add your first saving goal above, or quick-start the recommended Emergency and Vacation buckets."
        />
      )}
    </div>
  );
}
