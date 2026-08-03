import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarPlus, ClipboardList, Gift, PiggyBank, Plus, RotateCcw, ShoppingBag, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, monthLabel, useStore } from "@/lib/store";
import { Input } from "./urgent";

function formatDay(d: string) {
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("ar-SA-u-ca-gregory", { day: "numeric", month: "long", weekday: "short" });
}


export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "التخطيط الذكي — منظم مصاريفي" },
      { name: "description", content: "خطة إنفاق شهرية، مبالغ إضافية، مدخرات ومكافآت في مكان واحد." },
      { property: "og:title", content: "التخطيط الذكي 💫" },
      { property: "og:description", content: "خططي شهرك، سجّلي مبالغك الإضافية، وكافئي نفسك." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const s = useStore();

  return (
    <AppShell title="التخطيط الذكي ✨" subtitle={`خطة ${monthLabel(s.currentMonth)}`}>
      <ExtraIncomeSection />

      <RewardSection />

      <MonthlyPlanSection
        items={s.monthlyPlan}
        income={s.totalIncome}
        onAdd={s.addPlanItem}
        onUpdate={s.updatePlanItem}
        onRemove={s.removePlanItem}
        onSpend={s.spendOnPlan}
        onReset={s.resetPlanSpent}
      />

      <SurplusSection />
    </AppShell>
  );
}

function ExtraIncomeSection() {
  const { extraIncome, addExtraIncome, removeExtraIncome, income, totalIncome } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [icon, setIcon] = useState("💵");

  const suggestions = ["💵", "🎁", "🏆", "🛍️", "📱", "💼", "🤝", "🌸"];
  const extrasTotal = extraIncome.reduce((a, b) => a + b.amount, 0);

  return (
    <>
      <SectionTitle
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground shadow-soft"
            aria-label="إضافة مبلغ"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      >
        دخل إضافي 💰
      </SectionTitle>

      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">إضافي هذا الشهر</p>
            <p className="text-lg font-bold text-success">+{formatSAR(extrasTotal)}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">إجمالي الدخل</p>
            <p className="text-sm font-semibold">{formatSAR(totalIncome)}</p>
            <p className="text-[10px] text-muted-foreground">راتب {formatSAR(income)}</p>
          </div>
        </div>
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
          <Input label="المصدر" value={source} onChange={setSource} placeholder="مثال: هدية، عمل حر، استرجاع" />
          <Input label="المبلغ" value={amount} onChange={setAmount} type="number" placeholder="0" />
          <Input label="التاريخ" value={date} onChange={setDate} type="date" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!source || !amount) return;
                addExtraIncome({ source, amount: Number(amount), date, icon });
                setSource(""); setAmount(""); setIcon("💵"); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      <div className="mt-3 space-y-2">
        {extraIncome.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">لا يوجد دخل إضافي هذا الشهر بعد.</p>
        )}
        {extraIncome.map((e) => (
          <Card key={e.id} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-success/10 text-lg">
              {e.icon ?? "💵"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.source}</p>
              <p className="text-[11px] text-muted-foreground">{e.date}</p>
            </div>
            <p className="shrink-0 text-sm font-bold text-success">+{formatSAR(e.amount)}</p>
            <button
              onClick={() => removeExtraIncome(e.id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}

function RewardSection() {
  const { urgent, debts, monthlyPlan, rewardClaimed, rewardNote, claimReward, unclaimReward } = useStore();
  const [note, setNote] = useState("");

  const allUrgentPaid = urgent.length === 0 || urgent.every((x) => x.paid || (x.installment && x.installment.monthsPaid > 0));
  const allDebtsPaid = debts.every((x) => x.paid);
  const noOverspend = monthlyPlan.every((p) => p.spent <= p.amount);
  const eligible = allUrgentPaid && allDebtsPaid && noOverspend;

  return (
    <>
      <SectionTitle>مكافأة الالتزام 🎁</SectionTitle>
      <Card
        className={`relative overflow-hidden ${
          rewardClaimed
            ? "border-2 border-warning/40 bg-warning/5"
            : eligible
              ? "border-2 border-success/40 bg-success/5"
              : ""
        }`}
      >
        <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-warning/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${
            rewardClaimed ? "bg-warning/20" : eligible ? "bg-success/20" : "bg-muted"
          }`}>
            {rewardClaimed ? "🎉" : eligible ? "🎁" : "💫"}
          </div>
          <div className="flex-1">
            {rewardClaimed ? (
              <>
                <p className="font-bold text-warning">استحققتِ مكافأتك! ✨</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{rewardNote || "التزامك يستاهل"}</p>
              </>
            ) : eligible ? (
              <>
                <p className="font-bold text-success">شطورة! أنتِ ملتزمة بالخطة 💚</p>
                <p className="mt-0.5 text-xs text-muted-foreground">اختاري مكافأة صغيرة لنفسك.</p>
              </>
            ) : (
              <>
                <p className="font-bold">في طريقك للمكافأة 🌱</p>
                <p className="mt-0.5 text-xs text-muted-foreground">سدّدي العاجل، وابتعدي عن تجاوز الخطة.</p>
              </>
            )}
          </div>
        </div>

        {!rewardClaimed && (
          <div className="mt-4 flex items-center gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مكافأتك اليوم (مثال: كوب لاتيه ☕)"
              className="w-full rounded-full border border-border bg-input/50 px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => { claimReward(note.trim() || undefined); setNote(""); }}
              disabled={!eligible}
              className="shrink-0 rounded-full gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Gift className="mr-1 inline h-3.5 w-3.5" /> استلام
            </button>
          </div>
        )}

        {rewardClaimed && (
          <button
            onClick={unclaimReward}
            className="mt-3 w-full rounded-full bg-muted py-2 text-xs font-medium text-muted-foreground"
          >
            إعادة تعيين المكافأة
          </button>
        )}
      </Card>
    </>
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
  const { currentMonth } = useStore();
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
        <span className="flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-primary" />
          خطة إنفاق {monthLabel(currentMonth)}
        </span>
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
            ? `الخطة تتجاوز الدخل بمقدار ${formatSAR(-remaining)} — راجعي البنود`
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
          <p className="py-6 text-center text-sm text-muted-foreground">ما فيه بنود في خطتك بعد — أضيفي أول بند 💫</p>
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
  const { removePlanLog } = useStore();
  const [val, setVal] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showLogs, setShowLogs] = useState(false);
  const logs = item.logs ?? [];
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
            <span>صرفتِ {formatSAR(item.spent)}</span>
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
            className="w-24 rounded-full border border-border bg-input/50 px-3 py-2 text-center text-sm outline-none focus:border-primary"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-border bg-input/50 px-3 py-2 text-center text-xs outline-none focus:border-primary"
          />
          <button
            onClick={() => { if (val) { onSpend(item.id, Math.abs(Number(val)), date); setVal(""); } }}
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

      {logs.length > 0 && (
        <div className="mt-3 rounded-2xl bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground">📅 تواريخ الاستخدام</p>
            {logs.length > 3 && (
              <button onClick={() => setShowLogs((v) => !v)} className="text-[11px] font-medium text-primary">
                {showLogs ? "إخفاء" : `عرض الكل (${logs.length})`}
              </button>
            )}
          </div>
          <ul className="mt-2 space-y-1.5">
            {(showLogs ? logs : logs.slice(0, 3)).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{formatDay(l.date)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatSAR(l.amount)}</span>
                  <button
                    onClick={() => removePlanLog(item.id, l.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="حذف العملية"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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

function SurplusSection() {
  const {
    totalIncome, urgent, dailyExpenses, monthlyPlan, surplusEntries, surplusTotal,
    extrasTotal, saveSurplus, removeSurplus, currentMonth,
  } = useStore();
  const [note, setNote] = useState("");
  const [custom, setCustom] = useState("");
  const [pending, setPending] = useState<number | null>(null);

  const spent =
    urgent.reduce((a, b) => a + b.amount, 0) +
    dailyExpenses.reduce((a, b) => a + b.amount, 0) +
    monthlyPlan.reduce((a, b) => a + (b.spent || 0), 0);
  const surplus = Math.max(0, Math.round(totalIncome - spent));
  const savedThisMonth = surplusEntries
    .filter((e) => e.month === currentMonth)
    .reduce((a, b) => a + b.amount, 0);

  return (
    <>
      <SectionTitle>الفائض من الشهر ➜ ادخار 🏦</SectionTitle>

      <div className="relative overflow-hidden rounded-3xl gradient-success p-5 text-primary-foreground shadow-elegant">
        <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="flex items-center gap-2 text-xs opacity-90">
          <PiggyBank className="h-4 w-4" />
          <span>فائض هذا الشهر</span>
        </div>
        <p className="mt-1 text-3xl font-black">{formatSAR(surplus)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">إجمالي مدخراتك</p>
            <p className="mt-0.5 font-bold">{formatSAR(surplusTotal + extrasTotal)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">ادّخرتِ هالشهر</p>
            <p className="mt-0.5 font-bold">{formatSAR(savedThisMonth)}</p>
          </div>
        </div>
      </div>

      <Card className="mt-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          الفائض ما ينتقل تلقائيًا — أنتِ اللي تقررين وين يروح 💗
        </p>
        <Input label="ملاحظة (اختياري)" value={note} onChange={setNote} placeholder="مثال: فائض ديسمبر" />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="مبلغ مخصص"
            className="w-full rounded-full border border-border bg-input/50 px-3 py-2 text-center text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              const v = Number(custom);
              if (v > 0) setPending(v);
            }}
            className="shrink-0 rounded-full bg-muted px-4 py-2 text-xs font-semibold"
          >
            اختاري الوجهة
          </button>
        </div>
        <button
          disabled={surplus <= 0}
          onClick={() => setPending(surplus)}
          className="w-full rounded-full gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-40"
        >
          🎀 قرري وش تسوين بالفائض ({formatSAR(surplus)})
        </button>

        {pending !== null && (
          <div className="space-y-2 rounded-3xl border border-primary/25 bg-primary/5 p-3">
            <p className="text-center text-xs font-semibold">
              وين تبين يروح {formatSAR(pending)}؟ 💭
            </p>
            <button
              onClick={() => {
                saveSurplus(pending, note || `فائض ${currentMonth}`, "alinma");
                setPending(null); setNote(""); setCustom("");
              }}
              className="w-full rounded-full gradient-success py-3 text-sm font-bold text-primary-foreground shadow-soft"
            >
              🏦 حوّليه لسداد الإنماء
            </button>
            <button
              onClick={() => {
                saveSurplus(pending, note || `فائض ${currentMonth}`, "savings");
                setPending(null); setNote(""); setCustom("");
              }}
              className="w-full rounded-full bg-muted py-3 text-sm font-bold"
            >
              💗 خليه في مدخراتي
            </button>
            <button
              onClick={() => setPending(null)}
              className="w-full py-1 text-[11px] text-muted-foreground"
            >
              إلغاء
            </button>
          </div>
        )}
      </Card>

      <div className="mt-3 space-y-2">
        {surplusEntries.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ما ادّخرتِ فائض بعد — أول تحويل بيكون بداية حلوة 🌸
          </p>
        )}
        {surplusEntries.map((e) => (
          <Card key={e.id} className="flex items-center gap-3 border border-success/20 bg-success/5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success/15 text-lg">
              {e.destination === "savings" ? "💗" : "🏦"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{e.note || `فائض ${e.month}`}</p>
                <p className="shrink-0 font-bold text-success">+{formatSAR(e.amount)}</p>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {e.date} · {e.destination === "savings" ? "في مدخراتك" : "سداد الإنماء"}
              </p>
            </div>
            <button
              onClick={() => removeSurplus(e.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
