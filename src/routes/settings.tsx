import { createFileRoute } from "@tanstack/react-router";
import { Download, Trash2, Upload, Wallet } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — منظم مصاريفي" },
      { name: "description", content: "تعديل الدخل الشهري والنسخ الاحتياطي." },
      { property: "og:title", content: "الإعدادات" },
      { property: "og:description", content: "تخصيص التطبيق حسب احتياجاتك." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { income, incomeSources, addIncomeSource, updateIncomeSource, removeIncomeSource } = useStore();

  const exportData = () => {
    const data = localStorage.getItem("monazem-masareefi-v2") ?? "{}";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        localStorage.setItem("monazem-masareefi-v2", String(r.result));
        location.reload();
      } catch {}
    };
    r.readAsText(file);
  };

  return (
    <AppShell title="الإعدادات">
      <SectionTitle>مصادر دخلي الشهري 💰</SectionTitle>
      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">إجمالي الدخل الشهري</p>
            <p className="text-lg font-bold">{formatSAR(income)}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {incomeSources.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.emoji ?? "💵"}</span>
                <input
                  value={s.name}
                  onChange={(e) => updateIncomeSource(s.id, { name: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                />
                <button onClick={() => removeIncomeSource(s.id)} className="rounded-full p-1.5 text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="rounded-xl bg-card px-3 py-2 text-[11px] text-muted-foreground">
                  المبلغ
                  <input
                    type="number"
                    value={s.amount}
                    onChange={(e) => updateIncomeSource(s.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full bg-transparent text-sm font-bold text-foreground outline-none"
                  />
                </label>
                <label className="rounded-xl bg-card px-3 py-2 text-[11px] text-muted-foreground">
                  يوم النزول (ميلادي)
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={s.day}
                    onChange={(e) =>
                      updateIncomeSource(s.id, { day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })
                    }
                    className="w-full bg-transparent text-sm font-bold text-foreground outline-none"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => addIncomeSource({ name: "مصدر دخل جديد", amount: 0, day: 1, emoji: "💵", received: false })}
          className="mt-3 w-full rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          + إضافة مصدر دخل
        </button>
      </Card>

      <SectionTitle>النسخ الاحتياطي</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={exportData} className="glass flex flex-col items-center gap-2 rounded-3xl p-5">
          <Download className="h-6 w-6 text-primary" />
          <span className="text-sm font-semibold">تصدير</span>
        </button>
        <label className="glass flex cursor-pointer flex-col items-center gap-2 rounded-3xl p-5">
          <Upload className="h-6 w-6 text-info" />
          <span className="text-sm font-semibold">استيراد</span>
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
        </label>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        البيانات محفوظة محليًا على جهازك. جاهزة للربط مع Firebase لاحقًا.
      </p>
    </AppShell>
  );
}
