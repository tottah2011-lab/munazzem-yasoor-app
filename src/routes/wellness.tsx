import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Award, Check, ChevronLeft, ChevronRight, Droplets, Dumbbell, Flame, Footprints, HeartPulse,
  Laptop, Minus, Moon, Pencil, Plus, Pill, Smile, Sparkles, Trash2, Weight, X,
} from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import {
  useStore, freqTarget, type WellnessListKey, type WellnessItem, type WellnessFreq, type JournalEntry,
  type DailyMetrics,
} from "@/lib/store";

export const Route = createFileRoute("/wellness")({
  head: () => ({
    meta: [
      { title: "عنايتي اليومية — منظم مصاريفي" },
      { name: "description", content: "قياساتك اليومية، عناية البشرة والشعر، فيتاميناتك، عبادتك وتطوير ذاتك — كل يوم بتاريخه." },
      { property: "og:title", content: "عنايتي اليومية 🌸" },
      { property: "og:description", content: "كل يوم بتاريخه — قياسات، عناية، عبادات وتطوير ذات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wellness,
});

const moods = [
  { key: "great", label: "ممتاز", emoji: "😄" },
  { key: "good", label: "جيد", emoji: "🙂" },
  { key: "meh", label: "عادي", emoji: "😐" },
  { key: "bad", label: "سيء", emoji: "😔" },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

const shiftDate = (d: string, delta: number) => {
  const x = new Date(d + "T00:00:00");
  x.setDate(x.getDate() + delta);
  return x.toISOString().slice(0, 10);
};

const weekStartOf = (d: string) => {
  const x = new Date(d + "T00:00:00");
  x.setDate(x.getDate() - ((x.getDay() + 1) % 7));
  return x.toISOString().slice(0, 10);
};

const inWeekOf = (date: string, ref: string) => date >= weekStartOf(ref) && date <= shiftDate(weekStartOf(ref), 6);

const dayLabel = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const shortDay = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "numeric" });

const isDoneOn = (i: WellnessItem, date: string) => {
  const dates = i.doneDates ?? [];
  const f = i.freq ?? "daily";
  if (f === "daily") return dates.includes(date);
  return dates.filter((d) => inWeekOf(d, date)).length >= freqTarget(f);
};

function Wellness() {
  const {
    wellness, setDailyMetrics, toggleWellnessItem, addWellnessItem, renameWellnessItem, removeWellnessItem,
    setWellnessItemFreq, logWellnessSession, undoWellnessSession, saveJournalEntry, removeJournalEntry,
  } = useStore();

  const today = todayStr();
  const [date, setDate] = useState(today);
  const logs = wellness.dailyLogs ?? {};
  const day: Partial<DailyMetrics> = logs[date] ?? {};

  const set = (patch: Partial<DailyMetrics>) => setDailyMetrics(date, patch);

  const trackedLists: WellnessListKey[] = ["skinCare", "hairCare", "skinWeekly", "hairWeekly", "vitamins", "onlineWork", "selfDev", "worship"];

  const dayScore = useMemo(() => {
    let total = 0, done = 0;
    for (const k of trackedLists) {
      for (const it of wellness[k] ?? []) {
        total++;
        if (isDoneOn(it, date)) done++;
      }
    }
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [wellness, date]);

  const last7 = useMemo(() => {
    const arr: { date: string; pct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = shiftDate(today, -i);
      let total = 0, done = 0;
      for (const k of trackedLists) {
        for (const it of wellness[k] ?? []) {
          total++;
          if (isDoneOn(it, d)) done++;
        }
      }
      arr.push({ date: d, pct: total ? Math.round((done / total) * 100) : 0 });
    }
    return arr;
  }, [wellness, today]);

  const listProps = {
    date,
    onToggle: toggleWellnessItem,
    onAdd: addWellnessItem,
    onRename: renameWellnessItem,
    onRemove: removeWellnessItem,
  };

  return (
    <AppShell title="عنايتي 🌸" subtitle="كل يوم بتاريخه — وكل إنجازاتك بمكان واحد">
      {/* شريط التاريخ */}
      <Card className="flex items-center justify-between gap-2 p-3">
        <button onClick={() => setDate(shiftDate(date, -1))} className="grid h-9 w-9 place-items-center rounded-full bg-muted" aria-label="اليوم السابق">
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black">{date === today ? "اليوم 🌷" : dayLabel(date)}</p>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="mt-1 rounded-full border border-border bg-input/50 px-3 py-1 text-[11px] outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => setDate(shiftDate(date, 1))}
          disabled={date >= today}
          className="grid h-9 w-9 place-items-center rounded-full bg-muted disabled:opacity-30"
          aria-label="اليوم التالي"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </Card>

      {/* قياسات اليوم — خانات صغيرة بسطر */}
      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <MiniMetric icon={Droplets} label="ماء" value={day.water ?? 0} step={1} suffix="كوب" tone="info"
          onChange={(v) => set({ water: v })} />
        <MiniMetric icon={Flame} label="سعرات" value={day.calories ?? 0} step={50} suffix="سعرة" tone="accent"
          onChange={(v) => set({ calories: v })} />
        <MiniMetric icon={Weight} label="الوزن" value={day.weight ?? wellness.weightKg} step={0.5} suffix="كجم" tone="secondary"
          onChange={(v) => set({ weight: v })} />
        <MiniMetric icon={Moon} label="النوم" value={day.sleep ?? 0} step={0.5} suffix="ساعة" tone="primary"
          onChange={(v) => set({ sleep: v })} />
        <MiniMetric icon={Footprints} label="خطوات" value={day.steps ?? 0} step={500} suffix="خطوة" tone="success"
          onChange={(v) => set({ steps: v })} />
      </div>

      {/* النتيجة المجمّعة */}
      <Card className="mt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">نتيجة {date === today ? "اليوم" : "هاليوم"}</p>
            <p className="text-2xl font-black text-primary">{dayScore.pct}%</p>
            <p className="text-[11px] text-muted-foreground">{dayScore.done} من {dayScore.total} مهمة ✨</p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-full"
            style={{ background: `conic-gradient(hsl(var(--primary)) ${dayScore.pct * 3.6}deg, hsl(var(--muted)) 0deg)` }}>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-card text-sm font-black">
              {dayScore.pct >= 80 ? "🌟" : dayScore.pct >= 40 ? "💗" : "🌱"}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-1.5">
          {last7.map((d) => (
            <button key={d.date} onClick={() => setDate(d.date)} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-14 w-full items-end overflow-hidden rounded-xl bg-muted/60">
                <div className="w-full gradient-primary transition-all" style={{ height: `${Math.max(6, d.pct)}%` }} />
              </div>
              <span className={`text-[9px] ${d.date === date ? "font-bold text-primary" : "text-muted-foreground"}`}>
                {new Date(d.date + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "narrow" })}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">آخر ٧ أيام — اضغطي على أي يوم ترجعين له 💗</p>
      </Card>

      <SectionTitle>العناية اليومية 🌸</SectionTitle>
      <ChecklistSection compact title="للبشرة 🧴" icon={Smile} listKey="skinCare" items={wellness.skinCare ?? []} {...listProps} />
      <ChecklistSection compact title="للشعر 💇‍♀️" icon={Sparkles} listKey="hairCare" items={wellness.hairCare ?? []} {...listProps} />

      <SectionTitle>العناية الأسبوعية — الاثنين والخميس 🗓️</SectionTitle>
      <ChecklistSection compact title="للبشرة 🌷" icon={Smile} listKey="skinWeekly" items={wellness.skinWeekly ?? []} weekly
        onSetFreq={setWellnessItemFreq} onLog={logWellnessSession} onUndo={undoWellnessSession} {...listProps} />
      <ChecklistSection compact title="للشعر 🪷" icon={Sparkles} listKey="hairWeekly" items={wellness.hairWeekly ?? []} weekly
        onSetFreq={setWellnessItemFreq} onLog={logWellnessSession} onUndo={undoWellnessSession} {...listProps} />

      <ChecklistSection title="فيتاميناتي 💊" icon={Pill} listKey="vitamins" items={wellness.vitamins ?? []}
        weekly showDates onSetFreq={setWellnessItemFreq} onLog={logWellnessSession} onUndo={undoWellnessSession} {...listProps} />

      <ChecklistSection compact title="أفق للخدمات الإلكترونية 💻" icon={Laptop} listKey="onlineWork" items={wellness.onlineWork ?? []} {...listProps} />
      <ChecklistSection compact title="العبادات 🤲" icon={HeartPulse} listKey="worship" items={wellness.worship ?? []} {...listProps} />
      <ChecklistSection compact title="تطوير الذات 📚" icon={Award} listKey="selfDev" items={wellness.selfDev ?? []} {...listProps} />
      <ChecklistSection compact title="جدول تمارين المقاومة 🏋️‍♀️" icon={Dumbbell} listKey="workouts" items={wellness.workouts ?? []} {...listProps} />
      <ChecklistSection compact title="جدولي الغذائي اليومي 🥗" icon={Flame} listKey="meals" items={wellness.meals ?? []} {...listProps} />

      <JournalSection entries={wellness.journal ?? []} onSave={saveJournalEntry} onRemove={removeJournalEntry} />

      <ChecklistSection compact title="مشاكل أبغى أحلها 💗" icon={HeartPulse} listKey="concerns" items={wellness.concerns ?? []} {...listProps} />

    </AppShell>
  );
}

const toneClass: Record<string, string> = {
  info: "bg-info/15 text-info",
  accent: "bg-accent/20 text-accent-foreground",
  secondary: "bg-secondary/20 text-secondary-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
};

function MiniMetric({
  icon: Icon, label, value, suffix, step, tone, onChange,
}: {
  icon: typeof Droplets; label: string; value: number; suffix: string; step: number; tone: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="min-w-[92px] flex-1 rounded-2xl border border-border/60 bg-card/70 p-2 text-center shadow-soft">
      <div className={`mx-auto grid h-7 w-7 place-items-center rounded-full ${toneClass[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-black leading-tight">{value}</p>
      <p className="text-[9px] text-muted-foreground">{suffix}</p>
      <div className="mt-1.5 flex gap-1">
        <button onClick={() => onChange(Math.max(0, +(value - step).toFixed(1)))} className="grid h-6 flex-1 place-items-center rounded-full bg-muted">
          <Minus className="h-3 w-3" />
        </button>
        <button onClick={() => onChange(+(value + step).toFixed(1))} className="grid h-6 flex-1 place-items-center rounded-full gradient-primary text-primary-foreground">
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function JournalSection({
  entries, onSave, onRemove,
}: {
  entries: JournalEntry[];
  onSave: (e: Omit<JournalEntry, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const today = todayStr();
  const [date, setDate] = useState(today);
  const current = entries.find((e) => e.date === date);
  const [mood, setMood] = useState<JournalEntry["mood"]>(current?.mood ?? "good");
  const [happy, setHappy] = useState(current?.happy ?? "");
  const [sad, setSad] = useState(current?.sad ?? "");
  const [showAll, setShowAll] = useState(false);

  const pickDate = (d: string) => {
    const e = entries.find((x) => x.date === d);
    setDate(d);
    setMood(e?.mood ?? "good");
    setHappy(e?.happy ?? "");
    setSad(e?.sad ?? "");
  };

  const save = () => {
    if (!happy.trim() && !sad.trim()) return;
    onSave({ date, mood, happy: happy.trim(), sad: sad.trim() });
  };

  const visible = showAll ? entries : entries.slice(0, 3);

  return (
    <>
      <SectionTitle>يومياتي 🌸 وش أحزنني أو أفرحني</SectionTitle>
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">اليوم</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => pickDate(e.target.value)}
            className="rounded-full border border-border bg-input/50 px-3 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {moods.map((m) => (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 transition ${
                mood === m.key ? "gradient-primary text-primary-foreground shadow-soft" : "bg-muted/50"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[11px] font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-success">🌷 وش فرّحني اليوم؟</label>
          <textarea
            value={happy}
            onChange={(e) => setHappy(e.target.value)}
            rows={2}
            placeholder="اكتبي أجمل شي صار لك..."
            className="w-full resize-none rounded-2xl border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <label className="block text-xs font-semibold text-destructive">🌧️ وش أحزنني اليوم؟</label>
          <textarea
            value={sad}
            onChange={(e) => setSad(e.target.value)}
            rows={2}
            placeholder="فضفضي هنا... كل شي بيمر 💗"
            className="w-full resize-none rounded-2xl border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={save}
          className="w-full rounded-full gradient-primary py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
        >
          {current ? "حدّثي يومياتي 💾" : "احفظي يومياتي 💗"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">
          يومياتك محفوظة ما تروح — ترجعين لها متى ما بغيتي 🌙
        </p>
      </Card>

      {entries.length > 0 && (
        <Card className="mt-3 space-y-2 p-3">
          <p className="px-1 text-xs font-bold text-muted-foreground">أرشيف يومياتي ({entries.length})</p>
          {visible.map((e) => (
            <div key={e.id} className="rounded-2xl bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">
                  {moods.find((m) => m.key === e.mood)?.emoji} {dayLabel(e.date)}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => pickDate(e.date)} className="text-muted-foreground hover:text-primary" aria-label="فتح">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onRemove(e.id)} className="text-muted-foreground hover:text-destructive" aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {e.happy && <p className="mt-1.5 text-xs text-success">🌷 {e.happy}</p>}
              {e.sad && <p className="mt-1 text-xs text-destructive">🌧️ {e.sad}</p>}
            </div>
          ))}
          {entries.length > 3 && (
            <button onClick={() => setShowAll((v) => !v)} className="w-full rounded-full bg-muted py-2 text-xs font-semibold">
              {showAll ? "إخفاء" : `عرض كل اليوميات (${entries.length})`}
            </button>
          )}
        </Card>
      )}
    </>
  );
}

const freqLabels: Record<WellnessFreq, string> = {
  daily: "يومي",
  weekly: "مرة بالأسبوع",
  twice: "مرتين بالأسبوع",
};
const freqOrder: WellnessFreq[] = ["daily", "weekly", "twice"];

function ChecklistSection({
  title, icon: Icon, listKey, items, date, onToggle, onAdd, onRename, onRemove, weekly, onSetFreq, onLog, onUndo, showDates, compact,
}: {
  title: string;
  icon: typeof Smile;
  listKey: WellnessListKey;
  items: WellnessItem[];
  date: string;
  onToggle: (list: WellnessListKey, id: string, date?: string) => void;
  onAdd: (list: WellnessListKey, label: string, freq?: WellnessFreq) => void;
  onRename: (list: WellnessListKey, id: string, label: string) => void;
  onRemove: (list: WellnessListKey, id: string) => void;
  weekly?: boolean;
  onSetFreq?: (list: WellnessListKey, id: string, freq: WellnessFreq) => void;
  onLog?: (list: WellnessListKey, id: string, date?: string) => void;
  onUndo?: (list: WellnessListKey, id: string, date?: string) => void;
  showDates?: boolean;
  compact?: boolean;
}) {
  const done = items.filter((i) => isDoneOn(i, date)).length;
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newFreq, setNewFreq] = useState<WellnessFreq>(weekly ? "twice" : "daily");

  const startEdit = (item: WellnessItem) => {
    setEditingId(item.id);
    setEditValue(item.label);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) onRename(listKey, editingId, editValue.trim());
    setEditingId(null);
    setEditValue("");
  };

  return (
    <>
      <SectionTitle
        action={
          <button
            onClick={() => { setEditMode((v) => !v); setEditingId(null); }}
            className={`grid h-8 w-8 place-items-center rounded-full text-xs font-medium transition ${
              editMode ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
            aria-label="تحرير"
          >
            {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        }
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">({done}/{items.length})</span>
        </span>
      </SectionTitle>
      <Card className={compact ? "space-y-1 p-2" : "space-y-2 p-3"}>
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">ما فيه عناصر — أضيفي أول واحد ✨</p>
        )}
        {items.map((i) => {
          const isEditing = editingId === i.id;
          const freq: WellnessFreq = i.freq ?? (weekly ? "twice" : "daily");
          const target = freqTarget(freq);
          const weekCount = (i.doneDates ?? []).filter((d) => inWeekOf(d, date)).length;
          const doneNow = isDoneOn(i, date);
          const isWeeklyItem = !!weekly && freq !== "daily";
          return (
            <div key={i.id} className={`flex items-center gap-2 rounded-2xl transition hover:bg-muted/50 ${compact ? "p-1.5" : "p-2"}`}>
              <button
                onClick={() => !editMode && onToggle(listKey, i.id, date)}
                disabled={editMode}
                className={`grid shrink-0 place-items-center rounded-full border-2 transition ${compact ? "h-5 w-5 text-[10px]" : "h-6 w-6"} ${
                  doneNow ? "border-success bg-success text-success-foreground" : "border-border"
                }`}
              >
                {doneNow && "✓"}
              </button>
              {isEditing ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                  autoFocus
                  className="flex-1 rounded-xl border border-primary bg-input/50 px-2 py-1 text-sm outline-none"
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <span className={`block truncate ${compact ? "text-xs" : "text-sm"} ${doneNow ? "text-muted-foreground line-through" : ""}`}>
                    {i.label}
                  </span>
                  {weekly && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {freqLabels[freq]}
                      </span>
                      {isWeeklyItem && (
                        <div className="flex gap-1">
                          {Array.from({ length: target }).map((_, k) => (
                            <span key={k} className={`h-1.5 w-5 rounded-full ${k < weekCount ? "bg-success" : "bg-muted"}`} />
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {isWeeklyItem ? `${weekCount}/${target} هالأسبوع` : `${weekCount} جلسة هالأسبوع`}
                      </span>
                    </div>
                  )}
                  {showDates && (i.doneDates ?? []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {[...(i.doneDates ?? [])].sort().reverse().slice(0, 6).map((d, k) => (
                        <span key={d + k} className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          {shortDay(d)}
                        </span>
                      ))}
                      {(i.doneDates ?? []).length > 6 && (
                        <span className="text-[10px] text-muted-foreground">+{(i.doneDates ?? []).length - 6}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {weekly && onLog && !editMode && !isEditing && (
                <div className="flex shrink-0 items-center gap-1">
                  {weekCount > 0 && onUndo && (
                    <button
                      onClick={() => onUndo(listKey, i.id, date)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground"
                      aria-label="تراجع عن جلسة"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onLog(listKey, i.id, date)}
                    className="flex h-7 items-center gap-1 rounded-full gradient-primary px-2.5 text-[10px] font-bold text-primary-foreground"
                  >
                    <Plus className="h-3 w-3" /> جلسة
                  </button>
                </div>
              )}
              {weekly && editMode && !isEditing && onSetFreq && (
                <button
                  onClick={() => onSetFreq(listKey, i.id, freqOrder[(freqOrder.indexOf(freq) + 1) % freqOrder.length])}
                  className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold"
                >
                  {freqLabels[freq]}
                </button>
              )}
              {editMode && !isEditing && (
                <>
                  <button onClick={() => startEdit(i)} className="text-muted-foreground hover:text-primary" aria-label="تعديل">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onRemove(listKey, i.id)} className="text-muted-foreground hover:text-destructive" aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              {isEditing && (
                <>
                  <button onClick={commitEdit} className="text-success" aria-label="حفظ">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground" aria-label="إلغاء">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        })}
        {editMode && (
          <div className="space-y-2 pt-1">
            {weekly && (
              <div className="flex gap-1.5">
                {freqOrder.map((f) => (
                  <button
                    key={f}
                    onClick={() => setNewFreq(f)}
                    className={`flex-1 rounded-full px-2 py-1.5 text-[10px] font-semibold transition ${
                      newFreq === f ? "gradient-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {freqLabels[f]}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newLabel.trim()) {
                    onAdd(listKey, newLabel.trim(), newFreq);
                    setNewLabel("");
                  }
                }}
                placeholder="اسم الخانة الجديدة..."
                className="flex-1 rounded-full border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  if (newLabel.trim()) {
                    onAdd(listKey, newLabel.trim(), newFreq);
                    setNewLabel("");
                  }
                }}
                className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground"
                aria-label="إضافة"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
