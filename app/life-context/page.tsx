"use client";
import { Card } from "@/components/ui/Card";
import { ContextForm } from "@/components/lifecontext/ContextForm";
import { AdviceList } from "@/components/lifecontext/AdviceList";

export default function LifeContextPage() {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card
        title="Your circumstances"
        subtitle="Tailors saving advice to your real life"
      >
        <ContextForm />
      </Card>
      <Card
        title="Living-below-means insights"
        subtitle="Generated from your spending this month"
      >
        <AdviceList />
      </Card>
    </div>
  );
}
