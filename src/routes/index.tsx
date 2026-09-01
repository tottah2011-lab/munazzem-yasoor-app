import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, ArrowLeft, CalendarClock, CalendarX2, Gift, PartyPopper, PiggyBank, Sparkles, Wallet, Zap } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, freqTarget, isDoneToday, isThisWeek, monthLabel, useStore, type WellnessItem } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الرئيسية — منظم مصاريفي" },
      { name: "description", content: "لوحة تحكم شهرية شاملة لدخلك والتزاماتك وتقسيطك." },
      { property: "og:title", content: "منظم مصاريفي 💖" },
      { property: "og:description", content: "لوحة تحكم شهرية شاملة لأموالك." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const {
    income, totalIncome, extrasTotal, urgent, dailyExpenses, currentMonth, rewardClaimed,
    isLate, daysLate, paymentDueDate, alinmaSavings, monthlyPlan, incomeSources, toggleIncomeReceived, wellness,
  } = useStore();

  const alinmaPaid = alinmaSavings.payments.reduce((s, p) => s + p.amount, 0);
  const alinmaLeft = Math.max(0, alinmaSavings.total - alinmaPaid);



  const totals = useMemo(() => {
    const installments = urgent.filter((x) => x.installment && x.installment.monthsTotal > 0);
    const commitments = urgent.filter((x) => !x.installment || x.installment.monthsTotal === 0);
    const installmentMonthly = installments.reduce((s, e) => s + e.amount, 0);
    const installmentLeft = installments.reduce(
      (s, e) => s + Math.max(0, e.installment!.monthsTotal - e.installment!.monthsPaid) * e.amount,
      0,
    );
    const commitmentsTotal = commitments.reduce((s, e) => s + e.amount, 0);
    const emergencyTotal = dailyExpenses.reduce((s, e) => s + e.amount, 0);
    const randomTotal = dailyExpenses.filter((d) => d.mistake).reduce((s, e) => s + e.amount, 0);
    // الرغبات لا تُحسب من الدخل، والدخل الإضافي يُعتبر ادخارًا
    const spend = installmentMonthly + commitmentsTotal + emergencyTotal;
    const remaining = totalIncome - spend;
    const usedPct = Math.min(100, Math.round((spend / Math.max(totalIncome, 1)) * 100));
    return {
      installmentMonthly, installmentLeft, commitmentsTotal, emergencyTotal, randomTotal, remaining, usedPct,
    };
  }, [totalIncome, urgent, dailyExpenses]);

  const remainingTone =
    totals.remaining < 0
      ? "text-destructive"
      : totals.remaining < totalIncome * 0.3
        ? "text-warning"
        : "text-success";

  const pieData = [
    { name: "تقسيط", value: totals.installmentMonthly, color: "var(--chart-1)" },
    { name: "التزامات", value: totals.commitmentsTotal, color: "var(--chart-2)" },
    { name: "صرف طارئ", value: totals.emergencyTotal, color: "var(--chart-4)" },
    { name: "المتبقي", value: Math.max(0, totals.remaining), color: "var(--chart-3)" },
  ].filter((d) => d.value > 0);

  const tips: { icon: typeof Sparkles; text: string; tone: string }[] = [];
  if (isLate)
    tips.push({ icon: CalendarX2, text: `تأخرتِ ${daysLate} يوم عن موعد السداد (1 من الشهر) — سدّدي التزاماتك اليوم 💗`, tone: "text-destructive" });
  if (totals.remaining < 0) tips.push({ icon: AlertCircle, text: "تجاوزتِ ميزانيتك! قلّلي من الصرف العشوائي.", tone: "text-destructive" });
  if (totals.randomTotal > 0)
    tips.push({ icon: Zap, text: `عندك ${formatSAR(totals.randomTotal)} صرف عشوائي هالشهر — راقبيه ✨`, tone: "text-warning" });
  if (urgent.some((u) => !u.paid))
    tips.push({ icon: Wallet, text: "لديك التزامات غير مدفوعة، ابدئي بها أولًا.", tone: "text-primary" });
  if (rewardClaimed)
    tips.push({ icon: Gift, text: "استلمتِ مكافأتك هذا الشهر! تستاهلين 🎁", tone: "text-warning" });
  if (tips.length === 0)
    tips.push({ icon: Sparkles, text: "أحسنتِ! أموالك تحت السيطرة هذا الشهر 💚", tone: "text-success" });

  const progress = useMemo(() => {
    const installments = urgent.filter((x) => x.installment && x.installment.monthsTotal > 0);
    const monthsTotal = installments.reduce((s, e) => s + e.installment!.monthsTotal, 0);
    const monthsPaid = installments.reduce((s, e) => s + e.installment!.monthsPaid, 0);
    const paidCount = urgent.filter((u) => u.paid).length;
    const planBudget = monthlyPlan.reduce((s, p) => s + p.amount, 0);
    const planSpent = monthlyPlan.reduce((s, p) => s + p.spent, 0);
    const pctOf = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
    return [
      { label: "الميزانية", emoji: "💰", pct: totals.usedPct, color: "var(--chart-1)" },
      { label: "الالتزامات", emoji: "✅", pct: pctOf(paidCount, urgent.length), color: "var(--chart-2)" },
      { label: "التقسيط", emoji: "🗓️", pct: pctOf(monthsPaid, monthsTotal), color: "var(--chart-4)" },
      { label: "الإنماء", emoji: "🏦", pct: pctOf(alinmaPaid, alinmaSavings.total), color: "var(--chart-3)" },
      { label: "الخطة", emoji: "📋", pct: pctOf(planSpent, planBudget), color: "var(--chart-1)" },
      { label: "الادخار", emoji: "💗", pct: pctOf(extrasTotal, Math.max(totalIncome, 1)), color: "var(--chart-2)" },
      { label: "صرف طارئ", emoji: "⚡", pct: pctOf(totals.emergencyTotal, Math.max(totalIncome, 1)), color: "var(--chart-4)" },
      { label: "صرف عشوائي", emoji: "🎲", pct: pctOf(totals.randomTotal, Math.max(totals.emergencyTotal, 1)), color: "var(--chart-3)" },
    ];
  }, [urgent, monthlyPlan, totals, alinmaPaid, alinmaSavings.total, extrasTotal, totalIncome]);

  const weekly = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeksLeft = Math.max(1, Math.ceil((daysInMonth - now.getDate() + 1) / 7));
    const allowance = Math.max(0, Math.round(totals.remaining / weeksLeft));
    const spent = dailyExpenses.filter((d) => isThisWeek(d.date)).reduce((s, d) => s + d.amount, 0);
    const pct = Math.min(100, Math.round((spent / Math.max(allowance, 1)) * 100));
    return { allowance, spent, pct, weeksLeft, over: spent > allowance };
  }, [totals.remaining, dailyExpenses]);

  const doneInstallments = useMemo(
    () =>
      urgent.filter(
        (x) => x.installment && x.installment.monthsTotal > 0 && x.installment.monthsPaid >= x.installment.monthsTotal,
      ),
    [urgent],
  );

  // 🎀 بطاقة اليوم — تتبدّل كل يوم بشكل تلقائي
  const dailyCard = useMemo(() => {
    const cards = [
      { emoji: "🌷", title: "همسة اليوم", text: "كل ريال توفّرينه اليوم هو راحة بال بكرة." },
      { emoji: "🫧", title: "تحدي اليوم", text: "جربي يوم بدون أي صرف عشوائي — تقدرين!" },
      { emoji: "🌙", title: "تذكير حلو", text: "الميزانية مو حرمان… هي اختيار للي يستاهل." },
      { emoji: "🍰", title: "دلال بحساب", text: "خصّصي مبلغ صغير لدلعك، وخليه مخطط له." },
      { emoji: "🦋", title: "خطوة صغيرة", text: "راجعي خطة الإنفاق دقيقة وحدة بس — يفرق." },
      { emoji: "💎", title: "قيمة", text: "اسألي نفسك: بأحتاجه بعد أسبوع؟ إذا لا، أجّليه." },
      { emoji: "🎠", title: "فرح", text: "احتفلي بأي التزام سددتيه، مهما كان صغير 💗" },
    ];
    const idx = Math.floor(Date.now() / 86400000) % cards.length;
    return cards[idx];
  }, []);

  // 🌸 التزام العناية: اليوم + تقييم آخر 3 شهور
  const care = useMemo(() => {
    const lists = Object.values(wellness).filter(Array.isArray) as WellnessItem[][];
    const items = lists.flat().filter((i) => i && typeof i.label === "string");
    const todayTotal = items.length;
    const todayDone = items.filter(isDoneToday).length;
    const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

    const now = new Date();
    const months = [2, 1, 0].map((back) => {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const elapsedDays = back === 0 ? now.getDate() : daysInMonth;
      let expected = 0;
      let actual = 0;
      for (const i of items) {
        const freq = i.freq ?? "daily";
        const weeks = Math.max(1, Math.ceil(elapsedDays / 7));
        expected += freq === "daily" ? elapsedDays : freqTarget(freq) * weeks;
        actual += (i.doneDates ?? []).filter((x) => x.startsWith(key)).length;
      }
      const pct = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
      const rating = pct >= 80 ? "ممتاز 🌟" : pct >= 55 ? "حلو 💗" : pct >= 30 ? "متوسط 🌷" : "يحتاج جهد 🫧";
      return { key, label: monthLabel(key), pct, rating };
    });

    return { todayDone, todayTotal, todayPct, months };
  }, [wellness]);

  // 💜 مصاريف الشهر المدفوعة فقط (اسم + تاريخ + مبلغ)
  const monthExpenses = useMemo(() => {
    const rows = [
      ...urgent
        .filter((u) => (u.installment && u.installment.monthsTotal > 0 ? u.installment.monthsPaid > 0 : u.paid))
        .map((u) => ({
          id: u.id,
          name: u.name,
          date: u.dueDate,
          amount: u.amount,
          kind: u.installment && u.installment.monthsTotal > 0 ? "قسط مدفوع" : "التزام مدفوع",
        })),
      ...dailyExpenses.map((d) => ({
        id: d.id,
        name: d.name,
        date: d.date,
        amount: d.amount,
        kind: d.mistake ? "صرف عشوائي" : "صرف طارئ",
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));
    const total = rows.reduce((s, r) => s + r.amount, 0);
    return { rows, total, over: total > totalIncome };
  }, [urgent, dailyExpenses, totalIncome]);





  return (
    <AppShell title={`أهلًا 💖 — ${monthLabel(currentMonth)}`} subtitle={`إجمالي دخلك ${formatSAR(totalIncome)}`}>
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-6 text-primary-foreground shadow-elegant">
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs opacity-90">الرصيد المتبقي ✨</p>
        <p className="mt-1 text-4xl font-black tracking-tight">{formatSAR(totals.remaining)}</p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] opacity-90">
            <span>استخدام الميزانية</span>
            <span>{totals.usedPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${totals.usedPct}%` }} />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between text-xs">
          <div>
            <p className="opacity-80">الراتب الشهري</p>
            <p className="font-bold">{formatSAR(income)}</p>
          </div>
          {extrasTotal > 0 && (
            <div>
              <p className="opacity-80">إضافي (ادخار)</p>
              <p className="font-bold">{formatSAR(extrasTotal)}</p>
            </div>
          )}
          <Link to="/settings" className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 font-medium">
            تعديل <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* مصادر الدخل ومواعيد نزولها */}
      <SectionTitle>دخلي هالشهر 💵</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {incomeSources.map((s) => {
          const today = new Date().getDate();
          const arrived = s.received || today >= s.day;
          return (
            <button
              key={s.id}
              onClick={() => toggleIncomeReceived(s.id)}
              className={`glass rounded-3xl p-4 text-right transition hover:scale-[1.02] ${
                s.received ? "bg-gradient-to-br from-success/20 to-success/5" : "bg-gradient-to-br from-primary/15 to-primary/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{s.emoji ?? "💵"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    s.received ? "bg-success/20 text-success" : arrived ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.received ? "استلمته ✅" : arrived ? "موعده عدّى" : `يوم ${s.day}`}
                </span>
              </div>
              <p className="mt-2 truncate text-[11px] text-muted-foreground">{s.name}</p>
              <p className="text-lg font-bold">{formatSAR(s.amount)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">ينزل {s.day} من كل شهر ميلادي</p>
            </button>
          );
        })}
      </div>



      {/* موعد السداد الثابت */}
      <Card
        className={`mt-4 flex items-center gap-3 border ${
          isLate ? "border-destructive/30 bg-destructive/5" : "border-info/20 bg-info/5"
        }`}
      >
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
            isLate ? "bg-destructive/15 text-destructive" : "bg-info/15 text-info"
          }`}
        >
          <CalendarX2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">فترة السداد: 1 من كل شهر 🗓️</p>
          <p className={`mt-0.5 text-xs ${isLate ? "text-destructive" : "text-muted-foreground"}`}>
            {isLate
              ? `تأخرتِ ${daysLate} يوم عن ${paymentDueDate} — فيه التزامات ما انسددت ⚠️`
              : `الاستحقاق ${paymentDueDate} — كل شي تمام 💚`}
          </p>
        </div>
      </Card>

      {/* 🌸 عنايتي — كل يوم بيومه */}
      <SectionTitle>عنايتي 🌸</SectionTitle>
      <Link to="/wellness" className="block rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/15 via-primary/10 to-secondary/10 p-4 transition hover:scale-[1.01]">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card/70 text-xl shadow-soft">🌸</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">عنايتي اليوم</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              خلّصتِ {care.todayDone} من {care.todayTotal} مهمة اليوم — {care.todayPct}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${care.todayPct}%` }} />
            </div>
          </div>
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-4 rounded-2xl bg-card/60 p-3">
          <p className="text-[11px] font-bold text-muted-foreground">تقييم الشهور ونسبة الالتزام 📊</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {care.months.map((m) => (
              <div key={m.key} className="rounded-2xl bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="mt-0.5 text-lg font-black">{m.pct}%</p>
                <p className="text-[10px]">{m.rating}</p>
              </div>
            ))}
          </div>
        </div>
      </Link>


      {/* 🎉 أقساط مكتملة */}
      {doneInstallments.length > 0 && (
        <div className="relative mt-4 overflow-hidden rounded-3xl gradient-primary p-5 text-primary-foreground shadow-elegant">
          <div className="absolute -top-8 -right-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5" />
            <p className="text-sm font-black">مبروك! قفلتِ قسط كامل 🎉</p>
          </div>
          <p className="mt-1 text-xs opacity-90">
            خلّصتِ {doneInstallments.length} قسط بالكامل — التزامك يستاهل احتفال 💗
          </p>
          <div className="mt-3 space-y-2">
            {doneInstallments.map((x) => (
              <div key={x.id} className="flex items-center justify-between rounded-2xl bg-white/15 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold">{x.name}</p>
                  <p className="opacity-90">
                    {x.installment!.monthsTotal} شهر × {formatSAR(x.amount)}
                  </p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="font-black">{formatSAR(x.amount * x.installment!.monthsTotal)}</p>
                  <p className="opacity-90">مسدّد بالكامل ✅</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="تقسيط (شهريًا)" value={formatSAR(totals.installmentMonthly)} icon={CalendarClock} to="/expenses" tone="from-info/20 to-info/5" />
        <StatCard label="التزامات شهرية" value={formatSAR(totals.commitmentsTotal)} icon={Wallet} to="/expenses" tone="from-primary/20 to-primary/5" />
        <StatCard label="صرف طارئ" value={formatSAR(totals.emergencyTotal)} icon={Zap} to="/expenses" tone="from-warning/20 to-warning/5" />
        <StatCard label={alinmaLeft > 0 ? "متبقي سداد الإنماء" : "سداد الإنماء ✅"} value={formatSAR(alinmaLeft)} icon={PiggyBank} to="/expenses" tone="from-success/20 to-success/5" />
      </div>

      {/* 💜 المصاريف المدفوعة */}
      <SectionTitle>إجمالي المصاريف المدفوعة 🧾</SectionTitle>
      <div
        className={`rounded-3xl border p-4 ${
          monthExpenses.over
            ? "border-destructive/40 bg-destructive/10"
            : "border-info/30 bg-gradient-to-br from-info/15 via-secondary/10 to-accent/10"
        }`}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">المدفوع فعليًا في {monthLabel(currentMonth)}</p>
            <p className={`text-3xl font-black ${monthExpenses.over ? "text-destructive" : "text-info"}`}>
              {formatSAR(monthExpenses.total)}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              monthExpenses.over ? "bg-destructive/20 text-destructive" : "bg-info/20 text-info"
            }`}
          >
            {monthExpenses.over ? "تجاوزتِ الدخل ⚠️" : "ضمن الدخل ✅"}
          </span>
        </div>

        {monthExpenses.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">ما فيه مصاريف مدفوعة هالشهر ✨</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {monthExpenses.rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-2xl bg-card/70 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{r.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {r.date || "بدون تاريخ"} • {r.kind}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-black ${monthExpenses.over ? "text-destructive" : ""}`}>
                  {formatSAR(r.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SectionTitle>مصروف الأسبوع 🗓️</SectionTitle>
      <Card className={`border ${weekly.over ? "border-destructive/30 bg-destructive/5" : "border-success/20 bg-success/5"}`}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">حدّك الأسبوعي</p>
            <p className="text-2xl font-black">{formatSAR(weekly.allowance)}</p>
          </div>
          <div className="text-left">
            <p className="text-[11px] text-muted-foreground">صرفتِ هالأسبوع</p>
            <p className={`text-lg font-bold ${weekly.over ? "text-destructive" : "text-success"}`}>{formatSAR(weekly.spent)}</p>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${weekly.over ? "bg-destructive" : "bg-success"}`}
            style={{ width: `${weekly.pct}%` }}
          />
        </div>
        <p className={`mt-2 text-xs ${weekly.over ? "text-destructive" : "text-muted-foreground"}`}>
          {weekly.over
            ? `تجاوزتِ حدّك بـ ${formatSAR(weekly.spent - weekly.allowance)} — خفّفي شوي 💗`
            : `باقي لك ${formatSAR(weekly.allowance - weekly.spent)} لين نهاية الأسبوع ✨ (${weekly.weeksLeft} أسبوع متبقي بالشهر)`}
        </p>
      </Card>

      <SectionTitle>نسبة التقدم ⚡</SectionTitle>
      <Card className="grid grid-cols-4 gap-2">
        {progress.map((p) => (
          <MiniRing key={p.label} label={p.label} pct={p.pct} color={p.color} emoji={p.emoji} />
        ))}
      </Card>


      <SectionTitle>توزيع المصاريف 🎨</SectionTitle>
      <Card>
        {pieData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات لعرضها بعد.</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => formatSAR(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {pieData.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                    <span className="truncate text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="shrink-0 font-semibold">{formatSAR(d.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <SectionTitle>المستشار الذكي 💬</SectionTitle>
      <div className="space-y-2">
        {tips.map((t, i) => (
          <Card key={i} className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted">
              <t.icon className={`h-5 w-5 ${t.tone}`} />
            </div>
            <p className="pt-1.5 text-sm leading-relaxed">{t.text}</p>
          </Card>
        ))}
      </div>

      {/* 🎀 بطاقة اليوم — مفاجأة تتبدّل كل يوم */}
      <SectionTitle>بطاقة اليوم 🎀</SectionTitle>
      <div className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-5">
        <span className="pointer-events-none absolute -top-6 -left-4 select-none text-6xl opacity-15 transition-transform duration-500 group-hover:rotate-12">
          {dailyCard.emoji}
        </span>
        <div className="relative flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card/70 text-xl shadow-soft">
            {dailyCard.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-primary">{dailyCard.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dailyCard.text}</p>
          </div>
        </div>
      </div>


      <p className={`mt-6 text-center text-xs ${remainingTone}`}>
        الرصيد المتوقع حتى نهاية الشهر: <span className="font-bold">{formatSAR(totals.remaining)}</span>
      </p>
    </AppShell>
  );
}

function StatCard({
  label, value, icon: Icon, to, tone,
}: { label: string; value: string; icon: typeof Wallet; to: string; tone: string }) {
  return (
    <Link to={to} className={`glass rounded-3xl bg-gradient-to-br ${tone} p-4 transition hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-card/80">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </Link>
  );
}

function MiniRing({ label, pct, color, emoji }: { label: string; pct: number; color: string; emoji: string }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
          <circle cx="24" cy="24" r={r} fill="none" stroke="var(--muted)" strokeWidth="5" />
          <circle
            cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`} className="transition-all"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[11px] font-bold">{pct}%</span>
      </div>
      <p className="text-center text-[10px] leading-tight text-muted-foreground">{emoji} {label}</p>
    </div>
  );
}
