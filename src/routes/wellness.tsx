import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Check, Droplets, Footprints, Minus, Moon, Pencil, Plus, Smile, Trash2, Utensils, Weight, X } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { useStore, type WellnessListKey, type WellnessItem } from "@/lib/store";

export const Route = createFileRoute("/wellness")({
  head: () => ({
    meta: [
      { title: "الدايت والعناية — منظم مصاريفي" },
      { name: "description", content: "تابع صحتك ودايتك وعنايتك الشخصية اليومية." },
      { property: "og:title", content: "الدايت والعناية" },
      { property: "og:description", content: "قسم متكامل للعناية الشخصية والدايت." },
    ],
  }),
  component: Wellness,
});

const moods = [
  { key: "great", label: "ممتاز", emoji: "😄" },
  { key: "good", label: "جيد", emoji: "🙂" },
  { key: "meh", label: "عادي", emoji: "😐" },
  { key: "bad", label: "سيء", emoji: "😔" },
] as const;

function Wellness() {
  const { wellness, setWellness, toggleWellnessItem, addWellnessItem, renameWellnessItem, removeWellnessItem } = useStore();

  return (
    <AppShell title="الدايت والعناية" subtitle="اهتم بنفسك يوميًا">
      <SectionTitle>الماء</SectionTitle>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-info/15 text-info">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">أكواب اليوم</p>
              <p className="text-2xl font-black">{wellness.waterCups} / {wellness.waterGoal}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setWellness({ waterCups: Math.max(0, wellness.waterCups - 1) })} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
              <Minus className="h-4 w-4" />
            </button>
            <button onClick={() => setWellness({ waterCups: wellness.waterCups + 1 })} className="grid h-10 w-10 place-items-center rounded-full gradient-info text-info-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full gradient-info transition-all"
            style={{ width: `${Math.min(100, (wellness.waterCups / wellness.waterGoal) * 100)}%` }}
          />
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberCard
          icon={Utensils}
          label="سعرات اليوم"
          value={wellness.calorieTarget}
          suffix="سعرة"
          onChange={(v) => setWellness({ calorieTarget: v })}
        />
        <NumberCard
          icon={Weight}
          label="الوزن"
          value={wellness.weightKg}
          suffix="كجم"
          onChange={(v) => setWellness({ weightKg: v })}
        />
        <NumberCard
          icon={Moon}
          label="ساعات النوم"
          value={wellness.sleepHours}
          suffix="ساعة"
          step={0.5}
          onChange={(v) => setWellness({ sleepHours: v })}
        />
        <NumberCard
          icon={Footprints}
          label={`الخطوات (هدف ${wellness.stepsGoal})`}
          value={wellness.steps}
          suffix="خطوة"
          step={500}
          onChange={(v) => setWellness({ steps: Math.max(0, Math.round(v)) })}
        />
      </div>

      <Card className="mt-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
            <Footprints className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">تقدّم الخطوات اليوم</p>
            <p className="text-lg font-bold">{wellness.steps} / {wellness.stepsGoal}</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full gradient-primary transition-all"
            style={{ width: `${Math.min(100, (wellness.steps / Math.max(wellness.stepsGoal, 1)) * 100)}%` }}
          />
        </div>
      </Card>

      <SectionTitle>المزاج اليوم</SectionTitle>
      <Card>
        <div className="flex items-center justify-between gap-2">
          {moods.map((m) => (
            <button
              key={m.key}
              onClick={() => setWellness({ mood: m.key })}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-3 transition ${
                wellness.mood === m.key ? "gradient-primary text-primary-foreground shadow-soft" : "bg-muted/50"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[11px] font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <ChecklistSection title="وجبات صحية" icon={Utensils} items={wellness.meals} onToggle={(id) => toggleWellnessItem("meals", id)} />
      <ChecklistSection title="العناية بالبشرة" icon={Smile} items={wellness.skinCare} onToggle={(id) => toggleWellnessItem("skinCare", id)} />
      <ChecklistSection title="العناية بالشعر" icon={Smile} items={wellness.hairCare} onToggle={(id) => toggleWellnessItem("hairCare", id)} />
      <ChecklistSection title="عادات يومية" icon={Activity} items={wellness.habits} onToggle={(id) => toggleWellnessItem("habits", id)} />
    </AppShell>
  );
}

function NumberCard({
  icon: Icon, label, value, suffix, step = 1, onChange,
}: { icon: typeof Droplets; label: string; value: number; suffix: string; step?: number; onChange: (v: number) => void }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-xl font-black">{value} <span className="text-xs font-normal text-muted-foreground">{suffix}</span></p>
      <div className="mt-2 flex gap-1.5">
        <button onClick={() => onChange(Math.max(0, +(value - step).toFixed(1)))} className="grid h-8 flex-1 place-items-center rounded-full bg-muted">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onChange(+(value + step).toFixed(1))} className="grid h-8 flex-1 place-items-center rounded-full gradient-primary text-primary-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

function ChecklistSection({
  title, icon: Icon, items, onToggle,
}: { title: string; icon: typeof Utensils; items: { id: string; label: string; done: boolean }[]; onToggle: (id: string) => void }) {
  const done = items.filter((i) => i.done).length;
  return (
    <>
      <SectionTitle>
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">({done}/{items.length})</span>
        </span>
      </SectionTitle>
      <Card className="space-y-2 p-3">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => onToggle(i.id)}
            className="flex w-full items-center gap-3 rounded-2xl p-2 text-right transition hover:bg-muted/50"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                i.done ? "border-success bg-success text-success-foreground" : "border-border"
              }`}
            >
              {i.done && "✓"}
            </span>
            <span className={`flex-1 text-sm ${i.done ? "text-muted-foreground line-through" : ""}`}>{i.label}</span>
          </button>
        ))}
      </Card>
    </>
  );
}
