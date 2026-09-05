import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Plus, Sparkles, Trash2 } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore, type Goal2027 } from "@/lib/store";
import { Input } from "./urgent";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "أهداف 2027 — منظم مصاريفي" },
      { name: "description", content: "أحلامي وأهدافي لسنة 2027 بروح وحياة: مالي، صحة، روح، عمل وحياة." },
      { property: "og:title", content: "أهداف 2027 💫" },
      { property: "og:description", content: "كل حلم له مكان، وكل خطوة تُحتسب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GoalsPage,
});

const areas: Goal2027["area"][] = ["مالي", "صحة", "روح", "عمل", "حياة"];
const areaStyle: Record<Goal2027["area"], string> = {
  مالي: "bg-primary/10 text-primary",
  صحة: "bg-success/10 text-success",
  روح: "bg-info/10 text-info",
  عمل: "bg-warning/10 text-warning",
  حياة: "bg-destructive/10 text-destructive",
};
const iconChoices = ["💫", "🕊️", "🏦", "🌸", "📖", "💻", "✈️", "🏡", "🚗", "💍", "🎓", "🌱", "💗", "🏆"];

function GoalsPage() {
  const { goals2027, addGoal2027, toggleGoal2027, removeGoal2027, addToGoal2027 } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | Goal2027["area"]>("all");

  const done = goals2027.filter((g) => g.done).length;
  const pct = goals2027.length ? Math.round((done / goals2027.length) * 100) : 0;
  const daysLeft = useMemo(() => {
    const end = new Date("2027-12-31T00:00:00");
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  }, []);

  const list = goals2027.filter((g) => filter === "all" || g.area === filter);

  return (
    <AppShell title="أهداف 2027 💫" subtitle="أحلامي بروح وحياة" showMonth={false}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-5 text-primary-foreground shadow-elegant">
        <div className="absolute -top-10 -left-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-12 -right-6 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Sparkles className="h-4 w-4" />
          <span>لوحة أحلامي</span>
        </div>
        <p className="mt-2 text-3xl font-black tracking-tight">{pct}%</p>
        <p className="text-xs opacity-90">تحقق {done} من {goals2027.length} حلم 💗</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-[11px] opacity-90">باقي {daysLeft} يوم على نهاية 2027 — كل يوم يقربك ✨</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["all", ...areas] as const).map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a as typeof filter)}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              filter === a ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {a === "all" ? "الكل" : a}
          </button>
        ))}
      </div>

      <SectionTitle
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground shadow-soft"
            aria-label="إضافة هدف"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      >
        أهدافي 🎯
      </SectionTitle>

      {showForm && <GoalForm onSubmit={(g) => { addGoal2027(g); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <div className="mt-3 space-y-2">
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">ما فيه أهداف هنا بعد 🌷</p>}
        {list.map((g) => (
          <GoalCard key={g.id} goal={g} onToggle={() => toggleGoal2027(g.id)} onRemove={() => removeGoal2027(g.id)} onSave={(n) => addToGoal2027(g.id, n)} />
        ))}
      </div>
    </AppShell>
  );
}

function GoalCard({
  goal, onToggle, onRemove, onSave,
}: { goal: Goal2027; onToggle: () => void; onRemove: () => void; onSave: (n: number) => void }) {
  const [amount, setAmount] = useState("");
  const saved = goal.saved ?? 0;
  const pct = goal.target ? Math.min(100, Math.round((saved / goal.target) * 100)) : 0;

  return (
    <Card className={goal.done ? "opacity-70" : ""}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl transition ${
            goal.done ? "bg-success text-success-foreground" : "bg-muted"
          }`}
          aria-label="تحقق الهدف"
        >
          {goal.done ? <Check className="h-5 w-5" /> : goal.icon}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold leading-snug ${goal.done ? "line-through" : ""}`}>{goal.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${areaStyle[goal.area]}`}>{goal.area}</span>
            {goal.done && goal.doneDate && <span className="text-[10px] text-muted-foreground">تحقق 🎉 {goal.doneDate}</span>}
          </div>
          {goal.note && <p className="mt-1 text-xs text-muted-foreground">{goal.note}</p>}

          {goal.target ? (
            <div className="mt-3 rounded-2xl bg-muted/40 p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{formatSAR(saved)} من {formatSAR(goal.target)}</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  placeholder="مبلغ"
                  className="min-w-0 flex-1 rounded-full border border-border bg-input/50 px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
                <button
                  onClick={() => { const n = Number(amount); if (n > 0) { onSave(n); setAmount(""); } }}
                  className="rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  ادخري 💗
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <button onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

function GoalForm({
  onSubmit, onCancel,
}: { onSubmit: (g: Omit<Goal2027, "id" | "done">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("💫");
  const [area, setArea] = useState<Goal2027["area"]>("حياة");

  return (
    <Card className="mt-3 space-y-3">
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">أيقونة</span>
        <div className="flex flex-wrap gap-1.5">
          {iconChoices.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              className={`grid h-9 w-9 place-items-center rounded-full text-lg transition ${
                icon === i ? "gradient-primary shadow-soft" : "bg-muted"
              }`}
            >{i}</button>
          ))}
        </div>
      </div>
      <Input label="الحلم" value={title} onChange={setTitle} placeholder="مثال: أشتري سيارتي 🚗" />
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">المجال</span>
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => (
            <button
              key={a}
              onClick={() => setArea(a)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                area === a ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >{a}</button>
          ))}
        </div>
      </div>
      <Input label="مبلغ الهدف (اختياري)" value={target} onChange={setTarget} type="number" placeholder="0" />
      <Input label="ملاحظة" value={note} onChange={setNote} placeholder="ليش هذا الحلم يهمك 💗" />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            if (!title.trim()) return;
            onSubmit({
              title: title.trim(),
              icon,
              area,
              note: note.trim() || undefined,
              target: Number(target) > 0 ? Number(target) : undefined,
              saved: Number(target) > 0 ? 0 : undefined,
            });
          }}
          className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >حفظ الحلم</button>
        <button onClick={onCancel} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
      </div>
    </Card>
  );
}
