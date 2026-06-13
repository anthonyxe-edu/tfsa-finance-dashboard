"use client";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { uid } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import type { Goal } from "@/lib/types";

export function GoalForm() {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [kind, setKind] = useState<Goal["kind"]>("standard");
  const [deadline, setDeadline] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !(parseFloat(target) > 0)) return;
    await db.goals.add({
      id: uid(),
      name: name.trim(),
      target: parseFloat(target),
      saved: parseFloat(saved) || 0,
      kind,
      deadline: deadline || null,
    });
    setName("");
    setTarget("");
    setSaved("");
    setKind("standard");
    setDeadline("");
  }

  return (
    <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Goal name" htmlFor="g-name">
        <Input
          id="g-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New laptop"
        />
      </Field>
      <Field label="Target ($)" htmlFor="g-target">
        <Input
          id="g-target"
          type="number"
          min="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="2000"
        />
      </Field>
      <Field label="Saved ($)" htmlFor="g-saved">
        <Input
          id="g-saved"
          type="number"
          min="0"
          value={saved}
          onChange={(e) => setSaved(e.target.value)}
          placeholder="0"
        />
      </Field>
      <Field label="Type" htmlFor="g-kind">
        <Select
          id="g-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as Goal["kind"])}
        >
          <option value="standard">Standard</option>
          <option value="emergency">Emergency fund</option>
          <option value="vacation">Vacation</option>
        </Select>
      </Field>
      <Field label="Deadline (optional)" htmlFor="g-deadline">
        <Input
          id="g-deadline"
          type="month"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </Field>
      <div className="flex items-end">
        <Button type="submit" className="w-full sm:w-auto">
          <Plus size={16} /> Add goal
        </Button>
      </div>
    </form>
  );
}
