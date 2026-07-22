import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";
import { Input } from "./urgent";

export const Route = createFileRoute("/debts")({
  head: () => ({
    meta: [
      { title: "الديون — منظم مصاريفي" },
      { name: "description", content: "تابع ديونك المستحقة والمسددة." },
      { property: "og:title", content: "الديون" },
      { property: "og:description", content: "إدارة الديون وتسديدها." },
    ],
  }),
  component: DebtsPage,
});

function DebtsPage() {
  const { debts, addDebt, payDebt, removeDebt } = useStore();
  const [showForm, setShowForm] = useState(false);
  const unpaid = debts.filter((d) => !d.paid);
  const paid = debts.filter((d) => d.paid);
  const unpaidTotal = unpaid.reduce((s, d) => s + d.amount, 0);
  const paidTotal = paid.reduce((s, d) => s + d.amount, 0);

  return (
    <AppShell title="الديون" subtitle={`مستحقة: ${formatSAR(unpaidTotal)} · مسددة: ${formatSAR(paidTotal)}`}>
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-3 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="h-4 w-4" /> إضافة دين
      </button>

      {showForm && <DebtForm onSubmit={(v) => { addDebt(v); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <SectionTitle>غير مسددة</SectionTitle>
      <div className="space-y-2">
        {unpaid.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا توجد ديون مستحقة.</p>}
        {unpaid.map((d) => (
          <Card key={d.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{d.creditor}</p>
                <p className="shrink-0 font-bold text-destructive">{formatSAR(d.amount)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">يستحق {d.dueDate}</p>
              {d.notes && <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>}
            </div>
            <button
              onClick={() => payDebt(d.id)}
              className="shrink-0 rounded-full bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25"
            >
              تم السداد
            </button>
            <button onClick={() => removeDebt(d.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>

      <SectionTitle>مسددة</SectionTitle>
      <div className="space-y-2">
        {paid.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لم تسدد أي ديون بعد.</p>}
        {paid.map((d) => (
          <Card key={d.id} className="flex items-center gap-3 opacity-90">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
              <Check className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{d.creditor}</p>
                <p className="shrink-0 font-bold">{formatSAR(d.amount)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">تم الدفع في {d.paidDate}</p>
            </div>
            <button onClick={() => removeDebt(d.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function DebtForm({
  onSubmit, onCancel,
}: {
  onSubmit: (v: { creditor: string; amount: number; dueDate: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  return (
    <Card className="mt-4 space-y-3">
      <Input label="الدائن" value={creditor} onChange={setCreditor} placeholder="اسم الشخص أو الجهة" />
      <Input label="المبلغ" value={amount} onChange={setAmount} type="number" placeholder="0" />
      <Input label="تاريخ الاستحقاق" value={dueDate} onChange={setDueDate} type="date" />
      <Input label="ملاحظات" value={notes} onChange={setNotes} placeholder="اختياري" />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => creditor && amount && onSubmit({ creditor, amount: Number(amount), dueDate, notes: notes || undefined })}
          className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
      </div>
    </Card>
  );
}
