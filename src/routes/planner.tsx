import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList, Minus, PiggyBank, Plus, RotateCcw, ShoppingBag, Sparkles, Target, Trash2 } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";
import { Input } from "./urgent";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "التخطيط الذكي — منظم مصاريفي" },
      { name: "description", content: "قسّم دخلك بذكاء، تابع أهداف الادخار، وسجّل مصاريفك اليومية." },
      { property: "og:title", content: "التخطيط الذكي" },
      { property: "og:description", content: "توزيع الدخل، خطة الإنفاق، والادخار في مكان واحد." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const {
    income, budgetSplit, setBudgetSplit,
    savings, addSavingsGoal, addToSavings, removeSavingsGoal,
    monthlyPlan, addPlanItem, updatePlanItem, removePlanItem, spendOnPlan, resetPlanSpent,
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
    <AppShell title="التخطيط الذكي" subtitle="قسّم دخلك، خطّط، وادّخر">
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

      <MonthlyPlanSection
        items={monthlyPlan}
        income={income}
        onAdd={addPlanItem}
        onUpdate={updatePlanItem}
        onRemove={removePlanItem}
        onSpend={spendOnPlan}
        onReset={resetPlanSpent}
      />

      <SavingsSection
        savings={savings}
        onAdd={addSavingsGoal}
        onAddAmount={addToSavings}
        onRemove={removeSavingsGoal}
        recommended={amounts.savings}
      />
    </AppShell>
  );
}

function MonthlyPlanSection({
  items, income, onAdd, onUpdate, onRemove, onSpend, onReset,
}: {
  items: ReturnType<typeof useStore>["monthlyPlan"];
  income: number;
  onAdd: ReturnType<typeof useStore>["addPlanItem"];
  onUpdate: ReturnType<typeof useStore>["updatePlanItem"];
  onRemove: ReturnType<typeof useStore>["removePlanItem"];
  onSpend: ReturnType<typeof useStore>["spendOnPlan"];
  onReset: ReturnType<typeof useStore>["resetPlanSpent"];
}) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [icon, setIcon] = useState("💰");

  const planned = items.reduce((s, x) => s + x.amount, 0);
  const spentTotal = items.reduce((s, x) => s + x.spent, 0);
  const remaining = income - planned;
  const pct = Math.min(100, income > 0 ? Math.round((planned / income) * 100) : 0);
  const over = planned > income;

  const suggestions = ["🏠", "🛒", "⛽", "💡", "📱", "🏥", "🎓", "🏦", "☕", "👕", "🎁", "🚗"];

  return (
    <>
      <SectionTitle
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground shadow-soft"
            aria-label="إضافة بند"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      >
        خطة الإنفاق الشهرية
      </SectionTitle>

      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">الميزانية / المصروف</p>
            <p className="text-lg font-bold">{formatSAR(spentTotal)} <span className="text-xs text-muted-foreground">/ {formatSAR(planned)}</span></p>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">{over ? "تجاوز الدخل" : "متبقي من الدخل"}</p>
            <p className={`text-sm font-semibold ${over ? "text-destructive" : "text-success"}`}>
              {formatSAR(Math.abs(remaining))}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${over ? "bg-destructive" : "gradient-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={`mt-2 text-center text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}>
          {over
            ? `الخطة تتجاوز الدخل بمقدار ${formatSAR(-remaining)} — راجع البنود`
            : `خطتك تستخدم ${pct}% من دخلك (${formatSAR(income)})`}
        </p>
      </Card>

      {showForm && (
        <Card className="mt-3 space-y-3">
          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">أيقونة</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setIcon(s)}
                  className={`grid h-9 w-9 place-items-center rounded-full text-lg transition ${
                    icon === s ? "gradient-primary shadow-soft" : "bg-muted"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          <Input label="التصنيف" value={category} onChange={setCategory} placeholder="مثال: قهوة" />
          <Input label="الميزانية الشهرية" value={amount} onChange={setAmount} type="number" placeholder="0" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!category || !amount) return;
                onAdd({ category, amount: Number(amount), icon, spent: 0 });
                setCategory(""); setAmount(""); setIcon("💰"); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      <div className="mt-3 space-y-3">
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد بنود في خطتك بعد.</p>
        )}
        {items.map((it) => (
          <PlanItemCard
            key={it.id}
            item={it}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onSpend={onSpend}
            onReset={onReset}
          />
        ))}
      </div>
    </>
  );
}

function PlanItemCard({
  item, onUpdate, onRemove, onSpend, onReset,
}: {
  item: ReturnType<typeof useStore>["monthlyPlan"][number];
  onUpdate: ReturnType<typeof useStore>["updatePlanItem"];
  onRemove: ReturnType<typeof useStore>["removePlanItem"];
  onSpend: ReturnType<typeof useStore>["spendOnPlan"];
  onReset: ReturnType<typeof useStore>["resetPlanSpent"];
}) {
  const [val, setVal] = useState("");
  const remaining = item.amount - item.spent;
  const pct = item.amount > 0 ? Math.min(100, Math.round((item.spent / item.amount) * 100)) : 0;
  const over = item.spent > item.amount;
  const quickAmounts = [5, 10, 20, 50];

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-xl">
          {item.icon ?? "💰"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold">{item.category}</p>
            <p className={`shrink-0 text-sm font-bold ${over ? "text-destructive" : "text-foreground"}`}>
              {formatSAR(remaining < 0 ? 0 : remaining)}
              <span className="text-xs font-normal text-muted-foreground"> متبقي</span>
            </p>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>صرفت {formatSAR(item.spent)}</span>
            <span>من {formatSAR(item.amount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${over ? "bg-destructive" : pct > 80 ? "bg-warning" : "gradient-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {quickAmounts.map((q) => (
          <button
            key={q}
            onClick={() => onSpend(item.id, q)}
            className="rounded-full bg-muted px-3 py-1 text-xs font-medium hover:bg-primary/10"
          >
            +{q}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5">
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="مبلغ"
            className="w-full rounded-full border border-border bg-input/50 px-3 py-2 text-center text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => { if (val) { onSpend(item.id, Math.abs(Number(val))); setVal(""); } }}
            className="grid h-9 shrink-0 place-items-center gap-1 rounded-full gradient-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            <ShoppingBag className="h-3.5 w-3.5 inline ml-1" />
            صرفت
          </button>
        </div>
        <button
          onClick={() => onReset(item.id)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          aria-label="إعادة تصفير"
          title="تصفير المصروف"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">الميزانية:</span>
        <input
          type="number"
          value={item.amount}
          onChange={(e) => onUpdate(item.id, { amount: Math.max(0, Number(e.target.value)) })}
          className="w-20 rounded-full border border-border bg-input/50 px-2 py-1 text-center outline-none focus:border-primary"
        />
        <button
          onClick={() => onRemove(item.id)}
          className="mr-auto text-muted-foreground hover:text-destructive"
          aria-label="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
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
        المدخرات وأهدافك
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
