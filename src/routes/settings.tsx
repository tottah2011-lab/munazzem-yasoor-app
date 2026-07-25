import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Upload, Wallet } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";
import { Input } from "./urgent";

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
  const { income, setIncome } = useStore();
  const [val, setVal] = useState(String(income));

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
      <SectionTitle>الدخل الشهري</SectionTitle>
      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">الحالي</p>
            <p className="text-lg font-bold">{formatSAR(income)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <Input label="تعديل الدخل" value={val} onChange={setVal} type="number" />
          </div>
          <button
            onClick={() => setIncome(Number(val) || 0)}
            className="rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            حفظ
          </button>
        </div>
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
