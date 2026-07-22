import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — منظم مصاريفي" },
      { name: "description", content: "تقارير شهرية شاملة لدخلك ومصاريفك." },
      { property: "og:title", content: "التقارير الشهرية" },
      { property: "og:description", content: "تقارير مالية مرئية شاملة." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { income, urgent, postponable, debts } = useStore();

  const data = useMemo(() => {
    const urgentTotal = urgent.reduce((s, e) => s + e.amount, 0);
    const postponableTotal = postponable.reduce((s, e) => s + e.amount, 0);
    const debtsTotal = debts.filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);
    const paidDebts = debts.filter((d) => d.paid).reduce((s, d) => s + d.amount, 0);
    const spending = urgentTotal + postponableTotal + debtsTotal;
    const savings = Math.max(0, income - spending);
    return { urgentTotal, postponableTotal, debtsTotal, paidDebts, spending, savings };
  }, [income, urgent, postponable, debts]);

  const chartData = [
    { name: "دخل", value: income },
    { name: "عاجل", value: data.urgentTotal },
    { name: "تأجيل", value: data.postponableTotal },
    { name: "ديون", value: data.debtsTotal },
    { name: "توفير", value: data.savings },
  ];

  return (
    <AppShell title="التقارير الشهرية" subtitle="نظرة شاملة على أموالك">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="إجمالي الدخل" value={formatSAR(income)} tone="text-success" />
        <Stat label="إجمالي الإنفاق" value={formatSAR(data.spending)} tone="text-destructive" />
        <Stat label="التوفير" value={formatSAR(data.savings)} tone="text-primary" />
        <Stat label="ديون مسددة" value={formatSAR(data.paidDebts)} tone="text-info" />
      </div>

      <SectionTitle>مخطط التوزيع</SectionTitle>
      <Card>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatSAR(v)}
              />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionTitle>ملخص الديون</SectionTitle>
      <Card className="space-y-2 text-sm">
        <Row label="عدد الديون الكلي" value={String(debts.length)} />
        <Row label="مسددة" value={String(debts.filter((d) => d.paid).length)} />
        <Row label="غير مسددة" value={String(debts.filter((d) => !d.paid).length)} />
        <Row label="إجمالي المستحق" value={formatSAR(data.debtsTotal)} />
      </Card>

      <SectionTitle>الإنفاق حسب الفئة</SectionTitle>
      <Card className="space-y-3">
        <Bar2 label="عاجلة" value={data.urgentTotal} total={data.spending || 1} color="var(--chart-1)" />
        <Bar2 label="قابلة للتأجيل" value={data.postponableTotal} total={data.spending || 1} color="var(--chart-2)" />
        <Bar2 label="ديون" value={data.debtsTotal} total={data.spending || 1} color="var(--chart-4)" />
      </Card>

      <button
        onClick={() => window.print()}
        className="mt-6 w-full rounded-full gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft"
      >
        طباعة / تصدير PDF
      </button>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-black ${tone}`}>{value}</p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Bar2({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{formatSAR(value)} · {pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
