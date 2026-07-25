import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, ArrowLeft, Clock, Gift, HandCoins, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, monthLabel, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الرئيسية — منظم مصاريفي" },
      { name: "description", content: "لوحة تحكم شهرية شاملة لدخلك ومصاريفك وديونك." },
      { property: "og:title", content: "منظم مصاريفي 💖" },
      { property: "og:description", content: "لوحة تحكم شهرية شاملة لأموالك." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { income, totalIncome, extraIncome, urgent, postponable, debts, currentMonth, rewardClaimed } = useStore();

  const totals = useMemo(() => {
    const urgentTotal = urgent.reduce((s, e) => s + e.amount, 0);
    const urgentPaid = urgent.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
    const postponableTotal = postponable.reduce((s, e) => s + e.amount, 0);
    const unpaidDebts = debts.filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);
    const paidDebts = debts.filter((d) => d.paid).reduce((s, d) => s + d.amount, 0);
    const extrasTotal = extraIncome.reduce((s, e) => s + e.amount, 0);
    const remaining = totalIncome - urgentTotal - unpaidDebts - postponableTotal;
    const usedPct = Math.min(100, Math.round(((urgentTotal + unpaidDebts + postponableTotal) / Math.max(totalIncome, 1)) * 100));
    return { urgentTotal, urgentPaid, postponableTotal, unpaidDebts, paidDebts, remaining, usedPct, extrasTotal };
  }, [totalIncome, extraIncome, urgent, postponable, debts]);

  const remainingTone =
    totals.remaining < 0
      ? "text-destructive"
      : totals.remaining < totalIncome * 0.3
        ? "text-warning"
        : "text-success";

  const pieData = [
    { name: "عاجلة", value: totals.urgentTotal, color: "var(--chart-1)" },
    { name: "قابلة للتأجيل", value: totals.postponableTotal, color: "var(--chart-2)" },
    { name: "ديون", value: totals.unpaidDebts, color: "var(--chart-4)" },
    { name: "المتبقي", value: Math.max(0, totals.remaining), color: "var(--chart-3)" },
  ].filter((d) => d.value > 0);

  const tips: { icon: typeof Sparkles; text: string; tone: string }[] = [];
  if (totals.remaining < 0) tips.push({ icon: AlertCircle, text: "تجاوزتِ ميزانيتك! قلّلي من المصاريف الاختيارية.", tone: "text-destructive" });
  if (totals.unpaidDebts > 0) tips.push({ icon: HandCoins, text: "سدّدي الديون قبل الشراء الاختياري لراحتك المالية.", tone: "text-warning" });
  if (urgent.some((u) => !u.paid))
    tips.push({ icon: Wallet, text: "لديك مصاريف عاجلة غير مدفوعة، ابدئي بها أولًا.", tone: "text-primary" });
  if (rewardClaimed)
    tips.push({ icon: Gift, text: "استلمتِ مكافأتك هذا الشهر! تستاهلين 🎁", tone: "text-warning" });
  if (tips.length === 0)
    tips.push({ icon: Sparkles, text: "أحسنتِ! أموالك تحت السيطرة هذا الشهر 💚", tone: "text-success" });

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
            <p className="opacity-80">الراتب</p>
            <p className="font-bold">{formatSAR(income)}</p>
          </div>
          {totals.extrasTotal > 0 && (
            <div>
              <p className="opacity-80">+ إضافي</p>
              <p className="font-bold">{formatSAR(totals.extrasTotal)}</p>
            </div>
          )}
          <Link to="/settings" className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 font-medium">
            تعديل <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Stat grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard label="مصاريف عاجلة" value={formatSAR(totals.urgentTotal)} icon={Wallet} to="/expenses" tone="from-primary/20 to-primary/5" />
        <StatCard label="قابلة للتأجيل" value={formatSAR(totals.postponableTotal)} icon={Clock} to="/expenses" tone="from-info/20 to-info/5" />
        <StatCard label="ديون غير مسددة" value={formatSAR(totals.unpaidDebts)} icon={HandCoins} to="/expenses" tone="from-destructive/20 to-destructive/5" />
        <StatCard label="دخل إضافي" value={formatSAR(totals.extrasTotal)} icon={TrendingUp} to="/planner" tone="from-success/20 to-success/5" />
      </div>

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
