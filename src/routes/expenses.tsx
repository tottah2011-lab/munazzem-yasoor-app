import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle, Banknote, CalendarClock, CalendarX2, Check, HandCoins, Heart, Landmark, Minus, PiggyBank,
  Plus, Search, ShoppingBag, Sparkles, Sun, Target, Trash2, Wallet, Zap,
} from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";
import { Input } from "./urgent";


export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "خزنة مصاريفي — منظم مصاريفي" },
      { name: "description", content: "تقسيط، التزامات شهرية، ادخار، ورغبات الشراء في مكان واحد." },
      { property: "og:title", content: "خزنة مصاريفي" },
      { property: "og:description", content: "نظّمي أموالك: تقسيط، التزامات، ادخار، ورغبات." },
    ],
  }),
  component: ExpensesPage,
});

type Tab = "installment" | "commitments" | "daily" | "wishlist" | "alinma";

const priorityMap = {
  high: { label: "لازم قريب", color: "text-destructive bg-destructive/10" },
  medium: { label: "لما يتيسّر", color: "text-warning bg-warning/10" },
  low: { label: "دلع 💫", color: "text-info bg-info/10" },
};

function ExpensesPage() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>("installment");
  const [showForm, setShowForm] = useState(false);

  const installments = s.urgent.filter((x) => x.installment && x.installment.monthsTotal > 0);
  const commitments = s.urgent.filter((x) => !x.installment || x.installment.monthsTotal === 0);

  const installmentMonthly = installments.reduce((a, b) => a + b.amount, 0);
  const commitmentsTotal = commitments.reduce((a, b) => a + b.amount, 0);
  const commitmentsUnpaid = commitments.filter((x) => !x.paid).reduce((a, b) => a + b.amount, 0);
  const wishlistTotal = s.postponable.reduce((a, b) => a + b.amount, 0);

  const dailyTotal = s.dailyExpenses.reduce((a, b) => a + b.amount, 0);
  const dailyMistakes = s.dailyExpenses.filter((d) => d.mistake).reduce((a, b) => a + b.amount, 0);

  const alinmaPaid = s.alinmaSavings.payments.reduce((a, b) => a + b.amount, 0);
  const alinmaLeft = Math.max(0, s.alinmaSavings.total - alinmaPaid);

  const allPaidCommit = commitments.length > 0 && commitments.every((x) => x.paid);
  const encourage =
    allPaidCommit && alinmaLeft === 0 && s.alinmaSavings.total > 0
      ? "خرافي! سددتِ كل شيء 🎊 استمري بهذا الالتزام"
      : allPaidCommit
        ? "أحسنتِ! التزاماتك الشهرية كلها مدفوعة ✅"
        : dailyMistakes > 0
          ? "خذي نفس عميق 💗 وحاولي تقللين المصاريف الغلط بكرة"
          : "خطوة خطوة، ميزانيتك في تحسّن مستمر ✨";

  const tabs: { key: Tab; label: string; icon: typeof Wallet; count: number; hint: string }[] = [
    { key: "installment", label: "تقسيط", icon: CalendarClock, count: installments.length, hint: `${formatSAR(installmentMonthly)}/شهر` },
    { key: "commitments", label: "التزامات شهرية", icon: Wallet, count: commitments.length, hint: formatSAR(commitmentsUnpaid) },
    { key: "daily", label: "صرف طارئ", icon: Zap, count: s.dailyExpenses.length, hint: formatSAR(dailyTotal) },
    { key: "wishlist", label: "أشياء أبغي اشتريها", icon: ShoppingBag, count: s.postponable.length, hint: formatSAR(wishlistTotal) },
    { key: "alinma", label: "ادخار الإنماء", icon: Landmark, count: s.alinmaSavings.payments.length, hint: formatSAR(alinmaLeft) },
  ];

  const addLabel: Record<Tab, string> = {
    installment: "إضافة تقسيط جديد",
    commitments: "إضافة التزام شهري",
    daily: "أضيفي صرف طارئ ⚡",
    wishlist: "أضيفي شي تحلمين فيه ✨",
    alinma: "تسجيل سداد للإنماء 🏦",
  };


  return (
    <AppShell title="خزنة مصاريفي 💚" subtitle="تقسيط · التزامات · صرف طارئ · رغبات">
      <Card
        className={`flex items-center gap-3 border ${
          s.isLate ? "border-destructive/30 bg-destructive/5" : "border-info/20 bg-info/5"
        }`}
      >
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
            s.isLate ? "bg-destructive/15 text-destructive" : "bg-info/15 text-info"
          }`}
        >
          <CalendarX2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">
            موعد السداد ثابت: 1 من كل شهر 🗓️
          </p>
          <p className={`mt-0.5 text-xs ${s.isLate ? "text-destructive" : "text-muted-foreground"}`}>
            {s.isLate
              ? `تأخرتِ ${s.daysLate} يوم عن موعد ${s.paymentDueDate} — فيه التزامات ما انسددت ⚠️`
              : `الاستحقاق: ${s.paymentDueDate} — كل شي تمام 💚`}
          </p>
        </div>
      </Card>

      <Card className="mt-3 flex items-center gap-3 border border-success/20 bg-success/5">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium leading-relaxed">{encourage}</p>
      </Card>

      {/* Hero summary */}
      <div className="mt-4 relative overflow-hidden rounded-3xl gradient-primary p-5 text-primary-foreground shadow-soft">
        <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs opacity-90">إجمالي التزاماتك الشهرية</p>
        <p className="mt-1 text-3xl font-black tracking-tight">
          {formatSAR(commitmentsTotal + installmentMonthly)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">تقسيط</p>
            <p className="mt-0.5 font-bold">{formatSAR(installmentMonthly)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">التزامات</p>
            <p className="mt-0.5 font-bold">{formatSAR(commitmentsTotal)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">إنماء متبقي</p>
            <p className="mt-0.5 font-bold">{formatSAR(alinmaLeft)}</p>
          </div>

        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {tabs.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowForm(false); }}
              className={`snap-start shrink-0 flex flex-col items-center gap-1 rounded-3xl px-4 py-3 min-w-[92px] transition ${
                active
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold whitespace-nowrap">{t.label}</span>
              <span className={`text-[10px] ${active ? "opacity-90" : "opacity-70"} whitespace-nowrap`}>{t.hint}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setShowForm((v) => !v)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft"
      >
        <Plus className="h-4 w-4" />
        {addLabel[tab]}
      </button>

      {tab === "installment" && <InstallmentSection showForm={showForm} setShowForm={setShowForm} />}
      {tab === "commitments" && <CommitmentsSection showForm={showForm} setShowForm={setShowForm} />}
      {tab === "daily" && <DailySection showForm={showForm} setShowForm={setShowForm} />}
      {tab === "wishlist" && <WishlistSection showForm={showForm} setShowForm={setShowForm} />}
      {tab === "alinma" && <AlinmaSection showForm={showForm} setShowForm={setShowForm} />}

    </AppShell>
  );
}

/* ---------------- Installments ---------------- */

function InstallmentSection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { urgent, addUrgent, removeUrgent, payInstallmentMonth } = useStore();
  const list = urgent.filter((x) => x.installment && x.installment.monthsTotal > 0);

  return (
    <>
      {showForm && (
        <UrgentForm
          forceInstallment
          onSubmit={(v) => { addUrgent(v); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mt-4 space-y-2">
        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            ما عندك أي تقسيط حالياً 💚
          </p>
        )}
        {list.map((e) => {
          const inst = e.installment!;
          const remainingMonths = Math.max(0, inst.monthsTotal - inst.monthsPaid);
          const paidAmount = inst.monthsPaid * e.amount;
          const totalAmount = inst.monthsTotal * e.amount;
          const pct = Math.round((inst.monthsPaid / inst.monthsTotal) * 100);
          const closed = remainingMonths === 0;
          return (
            <Card key={e.id} className={closed ? "bg-muted/60 opacity-80 grayscale" : ""}>
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                    closed ? "bg-muted text-muted-foreground" : "bg-info/15 text-info"
                  }`}
                >
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate font-semibold ${closed ? "text-muted-foreground line-through" : ""}`}>{e.name}</p>
                    <p className={`shrink-0 font-bold ${closed ? "text-muted-foreground" : ""}`}>
                      {formatSAR(e.amount)}
                      <span className="text-[10px] font-normal text-muted-foreground">/شهر</span>
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {e.category && <span className="ml-2">{e.category} ·</span>}
                    قسط {inst.monthsPaid} من {inst.monthsTotal}
                    {!closed && <span className="mr-2 text-[10px]">• ينتقل تلقائيًا للشهر الجاي 🔁</span>}
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

              <div
                className={`mt-3 rounded-2xl border p-3 ${
                  closed ? "border-border bg-muted/40" : "border-info/15 bg-info/5"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {closed ? "مسدّد بالكامل ✅" : `متبقي ${remainingMonths} ${remainingMonths === 1 ? "شهر" : "أشهر"}`}
                  </span>
                  <span className={`font-bold ${closed ? "text-muted-foreground" : "text-success"}`}>{pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${closed ? "bg-muted-foreground/50" : "bg-success"}`}
                    style={{ width: `${pct}%` }}
                  />
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
                  disabled={closed}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold ${
                    closed ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground"
                  }`}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  {closed ? "اكتمل التقسيط 🎉" : "تسجيل قسط هذا الشهر"}
                </button>
              </div>
            </Card>
          );
        })}

      </div>
    </>
  );
}

/* ---------------- Monthly Commitments ---------------- */

function CommitmentsSection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { urgent, addUrgent, updateUrgent, removeUrgent } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");

  const list = urgent
    .filter((x) => !x.installment || x.installment.monthsTotal === 0)
    .filter((e) => {
      if (filter === "paid" && !e.paid) return false;
      if (filter === "unpaid" && e.paid) return false;
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

      <div className="mt-3 space-y-2">
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد التزامات.</p>
        )}
        {list.map((e) => (
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
                <p className={`truncate font-semibold ${e.paid ? "line-through opacity-60" : ""}`}>
                  {e.name}
                </p>
                <p className="shrink-0 font-bold">{formatSAR(e.amount)}</p>
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
          </Card>
        ))}
      </div>
    </>
  );
}

/* ---------------- Savings ---------------- */

function SavingsSection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { savings, addSavingsGoal, addToSavings, removeSavingsGoal } = useStore();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const total = savings.reduce((a, b) => a + b.current, 0);
  const goals = savings.reduce((a, b) => a + b.target, 0);

  return (
    <>
      {showForm && (
        <Card className="mt-4 space-y-3">
          <Input label="اسم الهدف" value={name} onChange={setName} placeholder="مثال: رحلة صيفية" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="المبلغ المستهدف" value={target} onChange={setTarget} type="number" placeholder="0" />
            <Input label="ادخرتِ حالياً" value={current} onChange={setCurrent} type="number" placeholder="0" />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!name || !target) return;
                addSavingsGoal({ name, target: Number(target), current: Number(current) || 0 });
                setName(""); setTarget(""); setCurrent("0"); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      {savings.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Card className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">إجمالي المدخرات</p>
            <p className="mt-1 text-sm font-bold text-success">{formatSAR(total)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">إجمالي الأهداف</p>
            <p className="mt-1 text-sm font-bold text-primary">{formatSAR(goals)}</p>
          </Card>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {savings.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            ابدئي أول هدف ادخار وخلي فلوسك تكبر 🌱
          </p>
        )}
        {savings.map((g) => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
          const done = g.current >= g.target && g.target > 0;
          return (
            <Card key={g.id}>
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${done ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                  {done ? <Heart className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{g.name}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">{formatSAR(g.current)}</span>
                      {" / "}{formatSAR(g.target)}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full transition-all ${done ? "bg-success" : "gradient-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => removeSavingsGoal(g.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[10, 50, 100, 200].map((n) => (
                  <button
                    key={n}
                    onClick={() => addToSavings(g.id, n)}
                    className="rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20"
                  >
                    +{n}
                  </button>
                ))}
                <button
                  onClick={() => addToSavings(g.id, -10)}
                  className="ms-auto grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="سحب 10"
                  title="سحب 10"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Wishlist ---------------- */

const wishCategories = [
  { key: "عناية", emoji: "💄" },
  { key: "ملابس", emoji: "👗" },
  { key: "سيارة", emoji: "🚗" },
  { key: "بيت", emoji: "🏠" },
  { key: "إلكترونيات", emoji: "📱" },
  { key: "هدايا", emoji: "🎁" },
  { key: "سفر", emoji: "✈️" },
  { key: "أخرى", emoji: "✨" },
] as const;

const iconChoices = ["💄","👗","👜","👟","💍","🧴","🌸","☕","📱","💻","🎧","🚗","⛽","🏠","🛋️","🎁","✈️","📚","🍰","🪞","🕯️","💗","✨","🎀"];

function wishEmoji(cat?: string) {
  return wishCategories.find((c) => c.key === cat)?.emoji ?? "✨";
}

function WishlistSection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { postponable, addPostponable, removePostponable, toggleWishBought } = useStore();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState<string>("عناية");
  const [icon, setIcon] = useState<string>("");
  const [filter, setFilter] = useState<string>("الكل");

  const cats = ["الكل", ...wishCategories.map((c) => c.key)];
  const filtered = filter === "الكل" ? postponable : postponable.filter((p) => (p.category || "أخرى") === filter);

  // group by category
  const groups = new Map<string, typeof postponable>();
  for (const item of filtered) {
    const key = item.category || "أخرى";
    if (!groups.has(key)) groups.set(key, [] as typeof postponable);
    groups.get(key)!.push(item);
  }

  return (
    <>
      {showForm && (
        <Card className="mt-4 space-y-3">
          <Input label="الشي اللي تبغينه" value={name} onChange={setName} placeholder="مثال: عطر جديد ✨" />
          <Input label="المبلغ التقريبي" value={amount} onChange={setAmount} type="number" placeholder="0" />
          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">التصنيف</span>
            <div className="flex flex-wrap gap-2">
              {wishCategories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    category === c.key ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.emoji} {c.key}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">اختاري الأيقونة 🎨</span>
            <div className="flex flex-wrap gap-1.5">
              {iconChoices.map((em) => (
                <button
                  key={em}
                  onClick={() => setIcon(em)}
                  className={`grid h-9 w-9 place-items-center rounded-2xl text-lg transition ${
                    icon === em ? "gradient-primary shadow-soft" : "bg-muted"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              placeholder="أو اكتبي إيموجي من عندك ✍️"
              className="mt-2 w-full rounded-full border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">كم تشتهينه؟</span>
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
                addPostponable({ name, amount: Number(amount), priority, category, icon: icon || undefined });
                setName(""); setAmount(""); setPriority("medium"); setIcon(""); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      <Card className="mt-4 flex items-center gap-3 border border-info/20 bg-info/5">
        <span className="text-xl">💭</span>
        <p className="text-xs leading-relaxed text-muted-foreground">
          هذي أحلامك — <span className="font-semibold text-foreground">ما تُحسب من دخلك ولا من ميزانيتك</span>،
          وإذا حققتِ وحدة تنشطب وتبقى ذكرى حلوة 🎀
        </p>
      </Card>

      {postponable.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {cats.map((c) => {
            const active = filter === c;
            const emoji = c === "الكل" ? "🌷" : wishEmoji(c);
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                  active ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {emoji} {c}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 space-y-4">
        {postponable.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            قائمة رغباتك فاضية — أضيفي شي يفرحك 💖
          </p>
        )}
        {[...groups.entries()].map(([cat, items]) => {
          const total = items.reduce((a, b) => a + b.amount, 0);
          return (
            <div key={cat}>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-sm font-bold">
                  <span className="me-1">{wishEmoji(cat)}</span>{cat}
                  <span className="ms-2 text-[11px] font-normal text-muted-foreground">({items.length})</span>
                </p>
                <p className="text-xs font-semibold text-primary">{formatSAR(total)}</p>
              </div>
              <div className="space-y-2">
                {items.map((e) => {
                  const p = priorityMap[e.priority];
                  return (
                    <Card
                      key={e.id}
                      className={`flex items-center gap-3 ${
                        e.bought ? "border border-success/30 bg-success/5" : ""
                      }`}
                    >
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg ${
                          e.bought ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {e.bought ? "🎀" : (e.icon || wishEmoji(e.category))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate font-semibold ${e.bought ? "line-through opacity-70" : ""}`}>
                            {e.name}
                          </p>
                          <p className={`shrink-0 font-bold ${e.bought ? "line-through opacity-70" : ""}`}>
                            {formatSAR(e.amount)}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {e.bought ? (
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                              تحقق حلمك 🎉 {e.boughtDate}
                            </span>
                          ) : (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.color}`}>{p.label}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWishBought(e.id)}
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                          e.bought
                            ? "bg-success text-success-foreground"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                        aria-label="اشتريتها"
                        title="اشتريتها — يتشطب عليها ويبقى في القائمة"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => removePostponable(e.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}


/* ---------------- Debts ---------------- */

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
        {paid.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لم تسددي أي ديون بعد.</p>}
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

/* ---------------- Emergency / Urgent spending ---------------- */

const dailyCategories = ["طعام", "قهوة", "مواصلات", "تسوّق", "ترفيه", "بقالة", "صحة", "طوارئ", "أخرى"];

function DailySection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { dailyExpenses, addDaily, toggleDailyMistake, removeDaily } = useStore();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("طعام");
  const [mistake, setMistake] = useState(false);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "mistake">("all");

  const list = filter === "mistake" ? dailyExpenses.filter((d) => d.mistake) : dailyExpenses;
  const total = dailyExpenses.reduce((a, b) => a + b.amount, 0);
  const mistakesTotal = dailyExpenses.filter((d) => d.mistake).reduce((a, b) => a + b.amount, 0);

  // group by date desc
  const byDate = new Map<string, typeof dailyExpenses>();
  for (const d of list) {
    if (!byDate.has(d.date)) byDate.set(d.date, [] as typeof dailyExpenses);
    byDate.get(d.date)!.push(d);
  }
  const sortedDates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1));

  return (
    <>
      {showForm && (
        <Card className="mt-4 space-y-3">
          <Input label="على إيش صرفتِ؟" value={name} onChange={setName} placeholder="مثال: تصليح مفاجئ للسيارة" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="المبلغ" value={amount} onChange={setAmount} type="number" placeholder="0" />
            <Input label="التاريخ" value={date} onChange={setDate} type="date" />
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">التصنيف</span>
            <div className="flex flex-wrap gap-2">
              {dailyCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    category === c ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <label className={`flex items-center gap-2 rounded-2xl border p-3 text-sm font-medium transition ${
            mistake ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border"
          }`}>
            <input
              type="checkbox"
              checked={mistake}
              onChange={(e) => setMistake(e.target.checked)}
              className="h-4 w-4 accent-destructive"
            />
            <AlertTriangle className="h-4 w-4" />
            صرف عشوائي (ما كان ضروري) ⚠️
          </label>
          <Input label="ملاحظة" value={note} onChange={setNote} placeholder="اختياري" />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!name || !amount) return;
                addDaily({ name, amount: Number(amount), date, category, mistake, note: note || undefined });
                setName(""); setAmount(""); setMistake(false); setNote(""); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Card className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">إجمالي الصرف الطارئ</p>
          <p className="mt-1 text-sm font-bold text-primary">{formatSAR(total)}</p>
        </Card>
        <Card className={`p-3 text-center ${mistakesTotal > 0 ? "border border-destructive/30 bg-destructive/5" : ""}`}>
          <p className="text-[10px] text-muted-foreground">صرف عشوائي ⚠️</p>
          <p className={`mt-1 text-sm font-bold ${mistakesTotal > 0 ? "text-destructive" : "text-success"}`}>
            {formatSAR(mistakesTotal)}
          </p>
        </Card>
      </div>

      {mistakesTotal > 0 && (
        <Card className="mt-3 flex items-start gap-3 border border-destructive/25 bg-destructive/5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="pt-1 text-xs leading-relaxed text-destructive">
            انتبهي 💗 صرفتِ {formatSAR(mistakesTotal)} بشكل عشوائي هالشهر — حاولي تقللينها الأسبوع الجاي.
          </p>
        </Card>
      )}

      <div className="mt-3 flex gap-2 text-xs">
        {(["all", "mistake"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all" ? "كل الصرف الطارئ" : "العشوائي فقط"}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-4">
        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            ما سجلتِ أي صرف طارئ بعد ⚡
          </p>
        )}
        {sortedDates.map((d) => {
          const items = byDate.get(d)!;
          const dayTotal = items.reduce((a, b) => a + b.amount, 0);
          return (
            <div key={d}>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-sm font-bold">📅 {d}</p>
                <p className="text-xs font-semibold text-primary">{formatSAR(dayTotal)}</p>
              </div>
              <div className="space-y-2">
                {items.map((e) => (
                  <Card
                    key={e.id}
                    className={`flex items-center gap-3 ${
                      e.mistake ? "border border-destructive/30 bg-destructive/5" : ""
                    }`}
                  >
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                      e.mistake ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
                    }`}>
                      {e.mistake ? <AlertTriangle className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{e.name}</p>
                        <p className={`shrink-0 font-bold ${e.mistake ? "text-destructive" : ""}`}>
                          {formatSAR(e.amount)}
                        </p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {e.category && <span>{e.category}</span>}
                        {e.mistake && (
                          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            ⚠️ عشوائي
                          </span>
                        )}
                      </div>
                      {e.note && <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>}
                    </div>
                    <button
                      onClick={() => toggleDailyMistake(e.id)}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                        e.mistake ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:text-destructive"
                      }`}
                      aria-label="تبديل صرف عشوائي"
                      title="تبديل صرف عشوائي"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeDaily(e.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Alinma Savings ---------------- */

function AlinmaSection({
  showForm, setShowForm,
}: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { alinmaSavings, setAlinmaTotal, addAlinmaPayment, removeAlinmaPayment, resetAlinma } = useStore();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [editTotal, setEditTotal] = useState(false);
  const [totalInput, setTotalInput] = useState(String(alinmaSavings.total || ""));

  const paid = alinmaSavings.payments.reduce((a, b) => a + b.amount, 0);
  const left = Math.max(0, alinmaSavings.total - paid);
  const pct = alinmaSavings.total > 0 ? Math.min(100, Math.round((paid / alinmaSavings.total) * 100)) : 0;
  const done = alinmaSavings.total > 0 && left === 0;

  return (
    <>
      {/* Hero Alinma card */}
      <div className={`mt-4 relative overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-elegant ${
        done ? "bg-gradient-to-br from-success to-success/70" : "gradient-info"
      }`}>
        <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Landmark className="h-4 w-4" />
          <span>ادخار الإنماء — سداد المقترض منه</span>
        </div>
        <p className="mt-2 text-xs opacity-80">المبلغ المتبقي عليكِ</p>
        <p className="mt-1 text-4xl font-black tracking-tight">{formatSAR(left)}</p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] opacity-90">
            <span>تم سداد {formatSAR(paid)}</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <div>
            <p className="opacity-80">إجمالي المقترض</p>
            <p className="font-bold">{formatSAR(alinmaSavings.total)}</p>
          </div>
          <button
            onClick={() => { setTotalInput(String(alinmaSavings.total || "")); setEditTotal((v) => !v); }}
            className="rounded-full bg-white/15 px-3 py-1.5 font-medium"
          >
            {alinmaSavings.total > 0 ? "تعديل المبلغ" : "حدّدي المبلغ"}
          </button>
        </div>
      </div>

      {editTotal && (
        <Card className="mt-3 space-y-3">
          <Input label="إجمالي المبلغ المقترض من ادخارك" value={totalInput} onChange={setTotalInput} type="number" placeholder="0" />
          <div className="flex gap-2">
            <button
              onClick={() => { setAlinmaTotal(Number(totalInput) || 0); setEditTotal(false); }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >حفظ</button>
            <button
              onClick={() => { if (confirm("متأكدة تبين تصفير كل شي؟")) resetAlinma(); }}
              className="rounded-full bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive"
            >تصفير</button>
            <button onClick={() => setEditTotal(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="mt-4 space-y-3">
          <Input label="مبلغ السداد" value={amount} onChange={setAmount} type="number" placeholder="0" />
          <Input label="التاريخ" value={date} onChange={setDate} type="date" />
          <Input label="ملاحظة" value={note} onChange={setNote} placeholder="اختياري" />
          <div className="flex flex-wrap gap-2">
            {[50, 100, 200, 500].map((n) => (
              <button
                key={n}
                onClick={() => setAmount(String(n))}
                className="rounded-full bg-info/10 px-3 py-1.5 text-xs font-semibold text-info hover:bg-info/20"
              >
                +{n}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!amount) return;
                addAlinmaPayment({ amount: Number(amount), date, note: note || undefined });
                setAmount(""); setNote(""); setShowForm(false);
              }}
              className="flex-1 rounded-full gradient-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >تسجيل السداد</button>
            <button onClick={() => setShowForm(false)} className="rounded-full bg-muted px-4 py-2.5 text-sm font-medium">إلغاء</button>
          </div>
        </Card>
      )}

      {alinmaSavings.total === 0 && !showForm && !editTotal && (
        <Card className="mt-4 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-info/10 text-info">
            <Landmark className="h-5 w-5" />
          </div>
          <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
            حدّدي أول شي كم المبلغ اللي سحبتيه من ادخارك، وبعدها سجّلي كل سداد وشوفي تقدمك 💚
          </p>
        </Card>
      )}

      <SectionTitle>سجل السداد 📖</SectionTitle>
      <div className="space-y-2">
        {alinmaSavings.payments.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">ما فيه أي سداد مسجّل بعد.</p>
        )}
        {alinmaSavings.payments.map((p) => (
          <Card key={p.id} className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success/15 text-success">
              <Check className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">سداد للإنماء</p>
                <p className="shrink-0 font-bold text-success">{formatSAR(p.amount)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">📅 {p.date}</p>
              {p.note && <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>}
            </div>
            <button onClick={() => removeAlinmaPayment(p.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}


/* ---------------- Shared urgent form ---------------- */

function UrgentForm({
  onSubmit, onCancel, forceInstallment = false,
}: {
  onSubmit: (v: {
    name: string; amount: number; dueDate: string; paid: boolean;
    notes?: string; category?: string;
    installment?: { monthsTotal: number; monthsPaid: number };
  }) => void;
  onCancel: () => void;
  forceInstallment?: boolean;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [isInstallment, setIsInstallment] = useState(forceInstallment);
  const [months, setMonths] = useState("");
  const [paidMonths, setPaidMonths] = useState("0");

  const monthlyN = Number(amount) || 0;
  const monthsN = Number(months) || 0;
  const total = monthlyN * monthsN;

  return (
    <Card className="mt-4 space-y-3">
      <Input label="الاسم" value={name} onChange={setName} placeholder={forceInstallment ? "مثال: سلفة السيارة" : "مثال: الإيجار"} />
      <Input
        label={isInstallment ? "القسط الشهري" : "المبلغ"}
        value={amount}
        onChange={setAmount}
        type="number"
        placeholder="0"
      />
      <Input label="تاريخ الاستحقاق" value={dueDate} onChange={setDueDate} type="date" />
      <Input label="التصنيف" value={category} onChange={setCategory} placeholder="فواتير، سكن..." />

      {!forceInstallment && (
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
        </div>
      )}

      {isInstallment && (
        <div className="rounded-2xl border border-info/20 bg-info/5 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input label="عدد الأشهر" value={months} onChange={setMonths} type="number" placeholder="12" />
            <Input label="المسدد سابقًا" value={paidMonths} onChange={setPaidMonths} type="number" placeholder="0" />
          </div>
          {total > 0 && (
            <div className="rounded-xl bg-background/60 p-2.5 text-center text-xs">
              <p className="text-muted-foreground">إجمالي التقسيط</p>
              <p className="mt-0.5 font-bold text-info">{formatSAR(total)}</p>
            </div>
          )}
        </div>
      )}

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
