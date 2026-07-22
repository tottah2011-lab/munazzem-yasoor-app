import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, Plus, Trash2 } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";
import { Input } from "./urgent";

export const Route = createFileRoute("/postponable")({
  head: () => ({
    meta: [
      { title: "المصاريف القابلة للتأجيل — منظم مصاريفي" },
      { name: "description", content: "قائمة المصاريف الاختيارية التي يمكن تأجيلها." },
      { property: "og:title", content: "المصاريف القابلة للتأجيل" },
      { property: "og:description", content: "نظّم مصاريفك الاختيارية." },
    ],
  }),
  component: PostponablePage,
});

const priorityMap = {
  high: { label: "عالية", color: "text-destructive bg-destructive/10" },
  medium: { label: "متوسطة", color: "text-warning bg-warning/10" },
  low: { label: "منخفضة", color: "text-info bg-info/10" },
};

function PostponablePage() {
  const { postponable, addPostponable, removePostponable, moveToUrgent } = useStore();
  const [showForm, setShowForm] = useState(false);
  const total = postponable.reduce((s, e) => s + e.amount, 0);

  return (
    <AppShell title="المصاريف القابلة للتأجيل" subtitle={`إجمالي ${formatSAR(total)}`}>
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft"
      >
        <Plus className="h-4 w-4" /> إضافة مصروف
      </button>

      {showForm && <PostponableForm onSubmit={(v) => { addPostponable(v); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <div className="mt-4 space-y-2">
        {postponable.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">لا توجد مصاريف حاليًا.</p>
        )}
        {postponable.map((e) => {
          const p = priorityMap[e.priority];
          return (
            <Card key={e.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{e.name}</p>
                  <p className="shrink-0 font-bold">{formatSAR(e.amount)}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.color}`}>{p.label}</span>
                  {e.notes && <span className="truncate text-xs text-muted-foreground">{e.notes}</span>}
                </div>
              </div>
              <button
                onClick={() => moveToUrgent(e.id)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                aria-label="نقل إلى العاجل"
                title="نقل إلى المصاريف العاجلة"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button onClick={() => removePostponable(e.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

function PostponableForm({
  onSubmit, onCancel,
}: {
  onSubmit: (v: { name: string; amount: number; priority: "low" | "medium" | "high"; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");
  return (
    <Card className="mt-4 space-y-3">
      <Input label="الاسم" value={name} onChange={setName} placeholder="مثال: قهوة" />
      <Input label="المبلغ" value={amount} onChange={setAmount} type="number" placeholder="0" />
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">الأولوية</span>
        <div className="flex gap-2">
          {(["high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`flex-1 rounded-2xl py-2 text-xs font-medium transition ${
                priority === p ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {priorityMap[p].label}
            </button>
          ))}
        </div>
      </div>
      <Input label="ملاحظات" value={notes} onChange={setNotes} placeholder="اختياري" />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => name && amount && onSubmit({ name, amount: Number(amount), priority, notes: notes || undefined })}
          className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
      </div>
    </Card>
  );
}
