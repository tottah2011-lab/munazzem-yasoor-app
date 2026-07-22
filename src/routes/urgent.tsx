import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";

export const Route = createFileRoute("/urgent")({
  head: () => ({
    meta: [
      { title: "المصاريف العاجلة — منظم مصاريفي" },
      { name: "description", content: "تابع مصاريفك العاجلة كالإيجار والفواتير والوقود." },
      { property: "og:title", content: "المصاريف العاجلة" },
      { property: "og:description", content: "إدارة المصاريف العاجلة والفواتير الشهرية." },
    ],
  }),
  component: UrgentPage,
});

function UrgentPage() {
  const { urgent, addUrgent, updateUrgent, removeUrgent } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");

  const filtered = urgent.filter((e) => {
    if (filter === "paid" && !e.paid) return false;
    if (filter === "unpaid" && e.paid) return false;
    return e.name.includes(q);
  });
  const total = urgent.reduce((s, e) => s + e.amount, 0);
  const paidTotal = urgent.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
  const remaining = total - paidTotal;

  return (
    <AppShell title="المصاريف العاجلة" subtitle="الفواتير والمستحقات الأساسية">
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="الإجمالي" value={formatSAR(total)} />
        <MiniStat label="المدفوع" value={formatSAR(paidTotal)} tone="text-success" />
        <MiniStat label="المتبقي" value={formatSAR(remaining)} tone="text-warning" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="glass flex flex-1 items-center gap-2 rounded-full px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-full gradient-primary text-primary-foreground shadow-soft"
          aria-label="إضافة"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        {(["all", "unpaid", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all" ? "الكل" : f === "paid" ? "مدفوعة" : "غير مدفوعة"}
          </button>
        ))}
      </div>

      {showForm && <ExpenseForm onSubmit={(v) => { addUrgent(v); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <div className="mt-4 space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد عناصر.</p>
        )}
        {filtered.map((e) => (
          <Card key={e.id} className="flex items-center gap-3">
            <button
              onClick={() => updateUrgent(e.id, { paid: !e.paid })}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                e.paid ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
              }`}
              aria-label="تبديل الدفع"
            >
              <Check className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate font-semibold ${e.paid ? "line-through opacity-60" : ""}`}>{e.name}</p>
                <p className="shrink-0 font-bold">{formatSAR(e.amount)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {e.category && <span className="ml-2">{e.category} ·</span>}
                يستحق {e.dueDate}
              </p>
              {e.notes && <p className="mt-1 text-xs text-muted-foreground">{e.notes}</p>}
            </div>
            <button onClick={() => removeUrgent(e.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function MiniStat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone}`}>{value}</p>
    </Card>
  );
}

export function ExpenseForm({
  onSubmit, onCancel,
}: {
  onSubmit: (v: { name: string; amount: number; dueDate: string; paid: boolean; notes?: string; category?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Card className="mt-4 space-y-3">
      <Input label="الاسم" value={name} onChange={setName} placeholder="مثال: الإيجار" />
      <Input label="المبلغ" value={amount} onChange={setAmount} type="number" placeholder="0" />
      <Input label="تاريخ الاستحقاق" value={dueDate} onChange={setDueDate} type="date" />
      <Input label="التصنيف" value={category} onChange={setCategory} placeholder="فواتير، سكن..." />
      <Input label="ملاحظات" value={notes} onChange={setNotes} placeholder="اختياري" />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => name && amount && onSubmit({ name, amount: Number(amount), dueDate, paid: false, notes: notes || undefined, category: category || undefined })}
          className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
      </div>
    </Card>
  );
}

export function Input({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-input/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
