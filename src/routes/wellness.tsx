import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Award, Check, Droplets, Footprints, Laptop, Minus, Moon, Pencil, Plus, Smile, Sparkles, Trash2, Utensils, Weight, X } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { useStore, type WellnessListKey, type WellnessItem } from "@/lib/store";

export const Route = createFileRoute("/wellness")({
  head: () => ({
    meta: [
      { title: "العناية وتطوير الذات — منظم مصاريفي" },
      { name: "description", content: "دايت، عناية، تطوير ذات، عملك الإلكتروني، وإنجازاتك." },
      { property: "og:title", content: "العناية وتطوير الذات 💖" },
      { property: "og:description", content: "اهتمي بنفسك وطوّري ذاتك يوميًا." },
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
    <AppShell title="العناية وتطوير الذات 💖" subtitle="اهتمي بنفسك وطوّري ذاتك">
      <SectionTitle>الماء 💧</SectionTitle>
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
        <NumberCard icon={Utensils} label="سعرات اليوم" value={wellness.calorieTarget} suffix="سعرة"
          onChange={(v) => setWellness({ calorieTarget: v })} />
        <NumberCard icon={Weight} label="الوزن" value={wellness.weightKg} suffix="كجم"
          onChange={(v) => setWellness({ weightKg: v })} />
        <NumberCard icon={Moon} label="ساعات النوم" value={wellness.sleepHours} suffix="ساعة" step={0.5}
          onChange={(v) => setWellness({ sleepHours: v })} />
        <NumberCard icon={Footprints} label={`الخطوات (${wellness.stepsGoal})`} value={wellness.steps} suffix="خطوة" step={500}
          onChange={(v) => setWellness({ steps: Math.max(0, Math.round(v)) })} />
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

      <SectionTitle>المزاج اليوم 🌈</SectionTitle>
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

      <ChecklistSection title="وجبات صحية 🥗" icon={Utensils} listKey="meals" items={wellness.meals}
        onToggle={toggleWellnessItem} onAdd={addWellnessItem} onRename={renameWellnessItem} onRemove={removeWellnessItem} />
      <ChecklistSection title="العناية بالبشرة 🌸" icon={Smile} listKey="skinCare" items={wellness.skinCare}
        onToggle={toggleWellnessItem} onAdd={addWellnessItem} onRename={renameWellnessItem} onRemove={removeWellnessItem} />
      <ChecklistSection title="العناية بالشعر 💇‍♀️" icon={Smile} listKey="hairCare" items={wellness.hairCare}
        onToggle={toggleWellnessItem} onAdd={addWellnessItem} onRename={renameWellnessItem} onRemove={removeWellnessItem} />
      <ChecklistSection title="عادات يومية ✨" icon={Activity} listKey="habits" items={wellness.habits}
        onToggle={toggleWellnessItem} onAdd={addWellnessItem} onRename={renameWellnessItem} onRemove={removeWellnessItem} />

      <ChecklistSection title="تطوير الذات 📚" icon={Sparkles} listKey="selfDev" items={wellness.selfDev}
        onToggle={toggleWellnessItem} onAdd={addWellnessItem} onRename={renameWellnessItem} onRemove={removeWellnessItem} />
      <ChecklistSection title="عملي الإلكتروني 💻" icon={Laptop} listKey="onlineWork" items={wellness.onlineWork}
        onToggle={toggleWellnessItem} onAdd={addWellnessItem} onRename={renameWellnessItem} onRemove={removeWellnessItem} />
      <ChecklistSection title="إنجازاتي 🏆" icon={Award} listKey="achievements" items={wellness.achievements}
        onToggle={toggleWellnessItem} onAdd={addWellnessItem} onRename={renameWellnessItem} onRemove={removeWellnessItem} />
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
  title, icon: Icon, listKey, items, onToggle, onAdd, onRename, onRemove,
}: {
  title: string;
  icon: typeof Utensils;
  listKey: WellnessListKey;
  items: WellnessItem[];
  onToggle: (list: WellnessListKey, id: string) => void;
  onAdd: (list: WellnessListKey, label: string) => void;
  onRename: (list: WellnessListKey, id: string, label: string) => void;
  onRemove: (list: WellnessListKey, id: string) => void;
}) {
  const done = items.filter((i) => i.done).length;
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const startEdit = (item: WellnessItem) => {
    setEditingId(item.id);
    setEditValue(item.label);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) onRename(listKey, editingId, editValue.trim());
    setEditingId(null);
    setEditValue("");
  };

  return (
    <>
      <SectionTitle
        action={
          <button
            onClick={() => { setEditMode((v) => !v); setEditingId(null); }}
            className={`grid h-8 w-8 place-items-center rounded-full text-xs font-medium transition ${
              editMode ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
            aria-label="تحرير"
          >
            {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        }
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">({done}/{items.length})</span>
        </span>
      </SectionTitle>
      <Card className="space-y-2 p-3">
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">ما فيه عناصر — أضيفي أول واحد ✨</p>
        )}
        {items.map((i) => {
          const isEditing = editingId === i.id;
          return (
            <div key={i.id} className="flex items-center gap-2 rounded-2xl p-2 transition hover:bg-muted/50">
              <button
                onClick={() => !editMode && onToggle(listKey, i.id)}
                disabled={editMode}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                  i.done ? "border-success bg-success text-success-foreground" : "border-border"
                }`}
              >
                {i.done && "✓"}
              </button>
              {isEditing ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  autoFocus
                  className="flex-1 rounded-xl border border-primary bg-input/50 px-2 py-1 text-sm outline-none"
                />
              ) : (
                <span className={`flex-1 text-sm ${i.done ? "text-muted-foreground line-through" : ""}`}>
                  {i.label}
                </span>
              )}
              {editMode && !isEditing && (
                <>
                  <button onClick={() => startEdit(i)} className="text-muted-foreground hover:text-primary" aria-label="تعديل">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onRemove(listKey, i.id)} className="text-muted-foreground hover:text-destructive" aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              {isEditing && (
                <>
                  <button onClick={commitEdit} className="text-success" aria-label="حفظ">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground" aria-label="إلغاء">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        })}
        {editMode && (
          <div className="flex items-center gap-2 pt-1">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLabel.trim()) {
                  onAdd(listKey, newLabel.trim());
                  setNewLabel("");
                }
              }}
              placeholder="اسم الخانة الجديدة..."
              className="flex-1 rounded-full border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => {
                if (newLabel.trim()) {
                  onAdd(listKey, newLabel.trim());
                  setNewLabel("");
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground"
              aria-label="إضافة"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>
    </>
  );
}
