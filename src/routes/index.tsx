import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, ArrowLeft, CalendarClock, CalendarX2, Compass, Gift, PiggyBank, Sparkles, Wallet, Zap } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, monthLabel, useStore } from "@/lib/store";

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
    isLate, daysLate, paymentDueDate, alinmaSavings, monthlyPlan,
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

      <Link
        to="/guide"
        className="mt-4 flex items-center gap-3 rounded-3xl gradient-info p-4 text-primary-foreground shadow-soft transition hover:scale-[1.01]"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/20">
          <Compass className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">وش أسوي بفلوسي؟ 🧭</p>
          <p className="mt-0.5 text-xs opacity-90">دليل بسيط يوجّهك خطوة بخطوة لإدارة مصاريفك</p>
        </div>
        <ArrowLeft className="h-4 w-4 shrink-0" />
      </Link>

      {/* Stat grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="تقسيط (شهريًا)" value={formatSAR(totals.installmentMonthly)} icon={CalendarClock} to="/expenses" tone="from-info/20 to-info/5" />
        <StatCard label="التزامات شهرية" value={formatSAR(totals.commitmentsTotal)} icon={Wallet} to="/expenses" tone="from-primary/20 to-primary/5" />
        <StatCard label="صرف طارئ" value={formatSAR(totals.emergencyTotal)} icon={Zap} to="/expenses" tone="from-warning/20 to-warning/5" />
        <StatCard label={alinmaLeft > 0 ? "متبقي سداد الإنماء" : "سداد الإنماء ✅"} value={formatSAR(alinmaLeft)} icon={PiggyBank} to="/expenses" tone="from-success/20 to-success/5" />
      </div>

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
