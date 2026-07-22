import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Banknote, Building2, Minus, PiggyBank, Plus, Sparkles, Target, Trash2, Wallet } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";
import { Input } from "./urgent";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "التخطيط الذكي — منظم مصاريفي" },
      { name: "description", content: "قسّم دخلك بذكاء، تابع أهداف الادخار، وأدر سلفية الإنماء." },
      { property: "og:title", content: "التخطيط الذكي" },
      { property: "og:description", content: "توزيع الدخل، الادخار، وسلفية الإنماء في مكان واحد." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const {
    income, budgetSplit, setBudgetSplit,
    savings, addSavingsGoal, addToSavings, removeSavingsGoal,
    alinma, setAlinma, payAlinmaInstallment,
  } = useStore();

  const total = budgetSplit.needs + budgetSplit.wants + budgetSplit.savings;
  const normalized = total > 0 ? total : 1;
  const amounts = {
    needs: Math.round((income * budgetSplit.needs) / normalized),
    wants: Math.round((income * budgetSplit.wants) / normalized),
    savings: Math.round((income * budgetSplit.savings) / normalized),
  };

  const presets = [
    { label: "50 / 30 / 20", v: { needs: 50, wants: 30, savings: 20 } },
    { label: "60 / 20 / 20", v: { needs: 60, wants: 20, savings: 20 } },
    { label: "70 / 20 / 10", v: { needs: 70, wants: 20, savings: 10 } },
    { label: "40 / 30 / 30", v: { needs: 40, wants: 30, savings: 30 } },
  ];

  return (
    <AppShell title="التخطيط الذكي" subtitle="قسّم دخلك، ادّخر، وأدر سلفتك">
      {/* Smart split */}
      <SectionTitle>تقسيم الدخل بذكاء</SectionTitle>
      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">الدخل الشهري</p>
            <p className="text-lg font-bold">{formatSAR(income)}</p>
          </div>
        </div>

        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${(budgetSplit.needs / normalized) * 100}%` }} />
          <div className="h-full bg-info" style={{ width: `${(budgetSplit.wants / normalized) * 100}%` }} />
          <div className="h-full bg-success" style={{ width: `${(budgetSplit.savings / normalized) * 100}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <SplitBox tone="text-primary" label="أساسيات" pct={budgetSplit.needs} amount={amounts.needs} />
          <SplitBox tone="text-info" label="اختيارية" pct={budgetSplit.wants} amount={amounts.wants} />
          <SplitBox tone="text-success" label="ادخار" pct={budgetSplit.savings} amount={amounts.savings} />
        </div>

        <div className="mt-4 space-y-3">
          <PctSlider label="أساسيات" value={budgetSplit.needs} onChange={(v) => setBudgetSplit({ needs: v })} />
          <PctSlider label="اختيارية" value={budgetSplit.wants} onChange={(v) => setBudgetSplit({ wants: v })} />
          <PctSlider label="ادخار" value={budgetSplit.savings} onChange={(v) => setBudgetSplit({ savings: v })} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setBudgetSplit(p.v)}
              className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>

        {total !== 100 && (
          <p className="mt-3 text-center text-xs text-warning">
            المجموع {total}% — يُفضّل أن يكون 100%.
          </p>
        )}
      </Card>

      {/* Savings */}
      <SavingsSection
        savings={savings}
        onAdd={addSavingsGoal}
        onAddAmount={addToSavings}
        onRemove={removeSavingsGoal}
        recommended={amounts.savings}
      />

      {/* Alinma loan */}
      <AlinmaSection
        alinma={alinma}
        setAlinma={setAlinma}
        payInstallment={payAlinmaInstallment}
      />
    </AppShell>
  );
}

function SplitBox({ tone, label, pct, amount }: { tone: string; label: string; pct: number; amount: number }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone}`}>{pct}%</p>
      <p className="mt-0.5 text-[11px] font-semibold">{formatSAR(amount)}</p>
    </div>
  );
}

function PctSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

function SavingsSection({
  savings, onAdd, onAddAmount, onRemove, recommended,
}: {
  savings: ReturnType<typeof useStore>["savings"];
  onAdd: ReturnType<typeof useStore>["addSavingsGoal"];
  onAddAmount: ReturnType<typeof useStore>["addToSavings"];
  onRemove: ReturnType<typeof useStore>["removeSavingsGoal"];
  recommended: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");

  const totalSaved = useMemo(() => savings.reduce((s, g) => s + g.current, 0), [savings]);
  const totalTarget = useMemo(() => savings.reduce((s, g) => s + g.target, 0), [savings]);

  return (
    <>
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
        الادخار وأهدافك
      </SectionTitle>

      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">إجمالي المدّخر</p>
            <p className="text-lg font-bold">{formatSAR(totalSaved)}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">من هدف</p>
            <p className="text-sm font-semibold">{formatSAR(totalTarget)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          المقترح ادخاره شهريًا حسب تقسيمك: <span className="font-bold text-success">{formatSAR(recommended)}</span>
        </p>
      </Card>

      {showForm && (
        <Card className="mt-3 space-y-3">
          <Input label="اسم الهدف" value={name} onChange={setName} placeholder="مثال: رحلة" />
          <Input label="المبلغ المستهدف" value={target} onChange={setTarget} type="number" placeholder="0" />
          <Input label="المدّخر حاليًا" value={current} onChange={setCurrent} type="number" placeholder="0" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!name || !target) return;
                onAdd({ name, target: Number(target), current: Number(current) || 0 });
                setName(""); setTarget(""); setCurrent(""); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >
              حفظ
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      <div className="mt-3 space-y-2">
        {savings.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد أهداف ادخار بعد.</p>
        )}
        {savings.map((g) => {
          const pct = Math.min(100, Math.round((g.current / Math.max(g.target, 1)) * 100));
          return (
            <Card key={g.id}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success">
                  <Target className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{g.name}</p>
                    <p className="shrink-0 text-sm font-bold">
                      {formatSAR(g.current)} <span className="text-muted-foreground">/ {formatSAR(g.target)}</span>
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{pct}%</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <QuickAmount onAmount={(v) => onAddAmount(g.id, v)} />
                <button
                  onClick={() => onRemove(g.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground hover:text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function QuickAmount({ onAmount }: { onAmount: (n: number) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex flex-1 items-center gap-1.5">
      <button
        onClick={() => val && onAmount(-Math.abs(Number(val)))}
        className="grid h-9 w-9 place-items-center rounded-full bg-muted"
        aria-label="سحب"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="مبلغ"
        className="w-full rounded-full border border-border bg-input/50 px-3 py-2 text-center text-sm outline-none focus:border-primary"
      />
      <button
        onClick={() => { if (val) { onAmount(Math.abs(Number(val))); setVal(""); } }}
        className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground"
        aria-label="إيداع"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function AlinmaSection({
  alinma, setAlinma, payInstallment,
}: {
  alinma: ReturnType<typeof useStore>["alinma"];
  setAlinma: ReturnType<typeof useStore>["setAlinma"];
  payInstallment: ReturnType<typeof useStore>["payAlinmaInstallment"];
}) {
  const [editing, setEditing] = useState(false);
  const [total, setTotal] = useState(String(alinma.totalAmount));
  const [monthly, setMonthly] = useState(String(alinma.monthlyInstallment));
  const [months, setMonths] = useState(String(alinma.monthsTotal));
  const [start, setStart] = useState(alinma.startDate ?? new Date().toISOString().slice(0, 10));

  const paid = alinma.monthsPaid * alinma.monthlyInstallment;
  const remainingMonths = Math.max(0, alinma.monthsTotal - alinma.monthsPaid);
  const remainingAmount = Math.max(0, alinma.totalAmount - paid);
  const pct = alinma.monthsTotal > 0
    ? Math.min(100, Math.round((alinma.monthsPaid / alinma.monthsTotal) * 100))
    : 0;

  const isConfigured = alinma.totalAmount > 0 && alinma.monthlyInstallment > 0;

  return (
    <>
      <SectionTitle
        action={
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
          >
            {editing ? "إغلاق" : isConfigured ? "تعديل" : "إعداد"}
          </button>
        }
      >
        سلفية الإنماء
      </SectionTitle>

      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-info/15 text-info">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">قيمة السلفة</p>
            <p className="text-lg font-bold">{formatSAR(alinma.totalAmount)}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">القسط الشهري</p>
            <p className="text-sm font-semibold">{formatSAR(alinma.monthlyInstallment)}</p>
          </div>
        </div>

        {isConfigured && (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-info transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">تم سداد {alinma.monthsPaid} من {alinma.monthsTotal}</span>
              <span className="font-bold">{pct}%</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">المتبقي</p>
                <p className="mt-1 text-sm font-bold text-warning">{formatSAR(remainingAmount)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{remainingMonths} شهرًا</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] text-muted-foreground">المسدد</p>
                <p className="mt-1 text-sm font-bold text-success">{formatSAR(paid)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{alinma.monthsPaid} أقساط</p>
              </div>
            </div>

            <button
              onClick={payInstallment}
              disabled={remainingMonths === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Banknote className="h-4 w-4" />
              تسجيل سداد قسط
            </button>
          </>
        )}

        {!isConfigured && !editing && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            لم يتم إعداد السلفة بعد. اضغط <span className="font-bold">إعداد</span> لإدخال التفاصيل.
          </p>
        )}
      </Card>

      {editing && (
        <Card className="mt-3 space-y-3">
          <Input label="قيمة السلفة الإجمالية" value={total} onChange={setTotal} type="number" placeholder="0" />
          <Input label="القسط الشهري" value={monthly} onChange={setMonthly} type="number" placeholder="0" />
          <Input label="عدد الأشهر الكلي" value={months} onChange={setMonths} type="number" placeholder="0" />
          <Input label="تاريخ بداية السلفة" value={start} onChange={setStart} type="date" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setAlinma({
                  totalAmount: Number(total) || 0,
                  monthlyInstallment: Number(monthly) || 0,
                  monthsTotal: Number(months) || 0,
                  startDate: start,
                });
                setEditing(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >
              حفظ
            </button>
            <button onClick={() => setEditing(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            <Wallet className="mr-1 inline h-3 w-3" />
            يمكن تعديل عدد الأقساط المسددة يدويًا لاحقًا.
          </p>
        </Card>
      )}
    </>
  );
}
