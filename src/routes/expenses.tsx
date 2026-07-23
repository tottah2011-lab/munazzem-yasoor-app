import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUp, Banknote, CalendarClock, Check, Clock, HandCoins, Plus, Search, Trash2, Wallet, Sparkles,
} from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";
import { Input } from "./urgent";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "المصاريف — منظم مصاريفي" },
      { name: "description", content: "المصاريف العاجلة والقابلة للتأجيل والديون في مكان واحد." },
      { property: "og:title", content: "المصاريف والديون" },
      { property: "og:description", content: "أدر مصاريفك وديونك بصفحة واحدة منظّمة." },
    ],
  }),
  component: ExpensesPage,
});

type Tab = "urgent" | "postponable" | "debts";

const priorityMap = {
  high: { label: "عالية", color: "text-destructive bg-destructive/10" },
  medium: { label: "متوسطة", color: "text-warning bg-warning/10" },
  low: { label: "منخفضة", color: "text-info bg-info/10" },
};

function ExpensesPage() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>("urgent");
  const [showForm, setShowForm] = useState(false);

  const urgentTotal = s.urgent.reduce((a, b) => a + b.amount, 0);
  const urgentUnpaid = s.urgent.filter((x) => !x.paid).reduce((a, b) => a + b.amount, 0);
  const urgentPaid = urgentTotal - urgentUnpaid;
  const postTotal = s.postponable.reduce((a, b) => a + b.amount, 0);
  const debtUnpaid = s.debts.filter((x) => !x.paid).reduce((a, b) => a + b.amount, 0);
  const debtPaid = s.debts.filter((x) => x.paid).reduce((a, b) => a + b.amount, 0);

  const installments = s.urgent.filter((x) => x.installment && x.installment.monthsTotal > 0);
  const installmentMonthly = installments.reduce((a, b) => a + b.amount, 0);

  const allPaidUrgent = s.urgent.length > 0 && s.urgent.every((x) => x.paid);
  const allPaidDebts = s.debts.length > 0 && s.debts.every((x) => x.paid);
  const encourage =
    allPaidUrgent && allPaidDebts
      ? "خرافي! سددت كل شيء 🎊 استمر بهذا الالتزام"
      : allPaidUrgent
        ? "أحسنت! المصاريف العاجلة كلها مدفوعة ✅"
        : allPaidDebts
          ? "مبروك! لا توجد ديون معلّقة 💚"
          : "خطوة خطوة، ميزانيتك في تحسّن مستمر ✨";

  const tabs: { key: Tab; label: string; icon: typeof Wallet; count: number }[] = [
    { key: "urgent", label: "عاجلة", icon: Wallet, count: s.urgent.length },
    { key: "postponable", label: "قابلة للتأجيل", icon: Clock, count: s.postponable.length },
    { key: "debts", label: "الديون", icon: HandCoins, count: s.debts.length },
  ];

  return (
    <AppShell title="المصاريف والديون" subtitle="كل شيء في مكان واحد">
      <Card className="flex items-center gap-3 border border-success/20 bg-success/5">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium leading-relaxed">{encourage}</p>
      </Card>

      {/* Hero total for urgent */}
      <div className="mt-4 relative overflow-hidden rounded-3xl gradient-primary p-5 text-primary-foreground shadow-soft">
        <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs opacity-90">إجمالي المصاريف العاجلة</p>
        <p className="mt-1 text-3xl font-black tracking-tight">{formatSAR(urgentTotal)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">مدفوع</p>
            <p className="mt-0.5 font-bold">{formatSAR(urgentPaid)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">متبقي</p>
            <p className="mt-0.5 font-bold">{formatSAR(urgentUnpaid)}</p>
          </div>
        </div>
        {installments.length > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/15 p-2.5 text-[11px]">
            <CalendarClock className="h-4 w-4" />
            <span>لديك {installments.length} تقسيط شهري بمجموع {formatSAR(installmentMonthly)}/شهر</span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStat label="اختيارية" value={formatSAR(postTotal)} tone="text-info" />
        <MiniStat label="ديون" value={formatSAR(debtUnpaid)} tone="text-destructive" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {tabs.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false); }}
              className={`flex flex-col items-center gap-1 rounded-3xl p-3 transition ${
                active
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-semibold">{t.label}</span>
              <span className={`text-[10px] ${active ? "opacity-90" : "opacity-70"}`}>{t.count} عنصر</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setShowForm((v) => !v)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft"
      >
        <Plus className="h-4 w-4" />
        {tab === "urgent" ? "إضافة مصروف عاجل" : tab === "postponable" ? "إضافة مصروف اختياري" : "إضافة دين"}
      </button>

      {tab === "urgent" && (
        <UrgentSection showForm={showForm} setShowForm={setShowForm} />
      )}
      {tab === "postponable" && (
        <PostSection showForm={showForm} setShowForm={setShowForm} />
      )}
      {tab === "debts" && (
        <DebtsSection showForm={showForm} setShowForm={setShowForm} paidTotal={debtPaid} />
      )}
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

function UrgentSection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { urgent, addUrgent, updateUrgent, removeUrgent, payInstallmentMonth } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid" | "installment">("all");

  const filtered = urgent.filter((e) => {
    if (filter === "paid" && !e.paid) return false;
    if (filter === "unpaid" && e.paid) return false;
    if (filter === "installment" && !e.installment) return false;
    return e.name.includes(q);
  });

  return (
    <>
      {showForm && (
        <UrgentForm
          onSubmit={(v) => { addUrgent(v); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

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
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {(["all", "unpaid", "paid", "installment"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all" ? "الكل" : f === "paid" ? "مدفوعة" : f === "unpaid" ? "غير مدفوعة" : "تقسيط"}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد عناصر.</p>
        )}
        {filtered.map((e) => {
          const inst = e.installment;
          const hasInst = inst && inst.monthsTotal > 0;
          const remainingMonths = hasInst ? Math.max(0, inst!.monthsTotal - inst!.monthsPaid) : 0;
          const paidAmount = hasInst ? inst!.monthsPaid * e.amount : 0;
          const totalAmount = hasInst ? inst!.monthsTotal * e.amount : e.amount;
          const pct = hasInst ? Math.round((inst!.monthsPaid / inst!.monthsTotal) * 100) : 0;
          return (
            <Card key={e.id}>
              <div className="flex items-center gap-3">
                {!hasInst && (
                  <button
                    onClick={() => updateUrgent(e.id, { paid: !e.paid })}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                      e.paid ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                    }`}
                    aria-label="تبديل الدفع"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                )}
                {hasInst && (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-info/15 text-info">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate font-semibold ${e.paid && !hasInst ? "line-through opacity-60" : ""}`}>
                      {e.name}
                    </p>
                    <p className="shrink-0 font-bold">
                      {formatSAR(e.amount)}
                      {hasInst && <span className="text-[10px] font-normal text-muted-foreground">/شهر</span>}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {e.category && <span className="ml-2">{e.category} ·</span>}
                    يستحق {e.dueDate}
                  </p>
                </div>
                <button
                  onClick={() => removeUrgent(e.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {hasInst && (
                <div className="mt-3 rounded-2xl bg-info/5 border border-info/15 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      قسط {inst!.monthsPaid} من {inst!.monthsTotal}
                    </span>
                    <span className="font-bold text-info">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-info transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl bg-background/60 p-2 text-center">
                      <p className="text-muted-foreground">مسدد</p>
                      <p className="font-bold text-success">{formatSAR(paidAmount)}</p>
                    </div>
                    <div className="rounded-xl bg-background/60 p-2 text-center">
                      <p className="text-muted-foreground">متبقي</p>
                      <p className="font-bold text-warning">{formatSAR(totalAmount - paidAmount)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => payInstallmentMonth(e.id)}
                    disabled={remainingMonths === 0}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    {remainingMonths === 0 ? "اكتمل التقسيط 🎉" : "تسجيل قسط هذا الشهر"}
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function UrgentForm({
  onSubmit, onCancel,
}: {
  onSubmit: (v: {
    name: string; amount: number; dueDate: string; paid: boolean;
    notes?: string; category?: string;
    installment?: { monthsTotal: number; monthsPaid: number };
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [months, setMonths] = useState("");
  const [paidMonths, setPaidMonths] = useState("0");

  const monthlyN = Number(amount) || 0;
  const monthsN = Number(months) || 0;
  const total = monthlyN * monthsN;

  return (
    <Card className="mt-4 space-y-3">
      <Input label="الاسم" value={name} onChange={setName} placeholder="مثال: الإيجار / سلفة السيارة" />
      <Input
        label={isInstallment ? "القسط الشهري" : "المبلغ"}
        value={amount}
        onChange={setAmount}
        type="number"
        placeholder="0"
      />
      <Input label="تاريخ الاستحقاق" value={dueDate} onChange={setDueDate} type="date" />
      <Input label="التصنيف" value={category} onChange={setCategory} placeholder="فواتير، سكن..." />

      <div className="rounded-2xl border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isInstallment}
            onChange={(e) => setIsInstallment(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <CalendarClock className="h-4 w-4 text-info" />
          هذا المصروف مقسّط على عدة أشهر
        </label>

        {isInstallment && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input label="عدد الأشهر" value={months} onChange={setMonths} type="number" placeholder="12" />
              <Input label="المسدد سابقًا" value={paidMonths} onChange={setPaidMonths} type="number" placeholder="0" />
            </div>
            {total > 0 && (
              <div className="rounded-xl bg-info/10 p-2.5 text-center text-xs">
                <p className="text-muted-foreground">إجمالي التقسيط</p>
                <p className="mt-0.5 font-bold text-info">{formatSAR(total)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Input label="ملاحظات" value={notes} onChange={setNotes} placeholder="اختياري" />

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            if (!name || !amount) return;
            onSubmit({
              name,
              amount: monthlyN,
              dueDate,
              paid: false,
              notes: notes || undefined,
              category: category || undefined,
              installment: isInstallment && monthsN > 0
                ? { monthsTotal: monthsN, monthsPaid: Math.min(monthsN, Number(paidMonths) || 0) }
                : undefined,
            });
          }}
          className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
      </div>
    </Card>
  );
}

function PostSection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { postponable, addPostponable, removePostponable, moveToUrgent } = useStore();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  return (
    <>
      {showForm && (
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
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!name || !amount) return;
                addPostponable({ name, amount: Number(amount), priority });
                setName(""); setAmount(""); setPriority("medium"); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      <div className="mt-4 space-y-2">
        {postponable.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">لا توجد مصاريف اختيارية.</p>
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
                </div>
              </div>
              <button
                onClick={() => moveToUrgent(e.id)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                aria-label="نقل للعاجل"
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
    </>
  );
}

function DebtsSection({
  showForm, setShowForm, paidTotal,
}: { showForm: boolean; setShowForm: (v: boolean) => void; paidTotal: number }) {
  const { debts, addDebt, payDebt, removeDebt } = useStore();
  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const unpaid = debts.filter((d) => !d.paid);
  const paid = debts.filter((d) => d.paid);

  return (
    <>
      {showForm && (
        <Card className="mt-4 space-y-3">
          <Input label="الدائن" value={creditor} onChange={setCreditor} placeholder="اسم الشخص أو الجهة" />
          <Input label="المبلغ" value={amount} onChange={setAmount} type="number" placeholder="0" />
          <Input label="تاريخ الاستحقاق" value={dueDate} onChange={setDueDate} type="date" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!creditor || !amount) return;
                addDebt({ creditor, amount: Number(amount), dueDate });
                setCreditor(""); setAmount(""); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      <SectionTitle>غير مسددة</SectionTitle>
      <div className="space-y-2">
        {unpaid.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا توجد ديون مستحقة 🎉</p>}
        {unpaid.map((d) => (
          <Card key={d.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{d.creditor}</p>
                <p className="shrink-0 font-bold text-destructive">{formatSAR(d.amount)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">يستحق {d.dueDate}</p>
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

      <SectionTitle>مسددة ({formatSAR(paidTotal)})</SectionTitle>
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
    </>
  );
}
