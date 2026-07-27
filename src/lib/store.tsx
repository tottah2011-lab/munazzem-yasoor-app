import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type UrgentExpense = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  notes?: string;
  category?: string;
  installment?: {
    monthsTotal: number;
    monthsPaid: number;
  };
};

export type PostponableExpense = {
  id: string;
  name: string;
  amount: number;
  priority: "low" | "medium" | "high";
  category?: string;
  notes?: string;
};


export type Debt = {
  id: string;
  creditor: string;
  amount: number;
  dueDate: string;
  notes?: string;
  paid: boolean;
  paidDate?: string;
};

export type WellnessItem = { id: string; label: string; done: boolean };

export type WellnessListKey =
  | "meals"
  | "skinCare"
  | "hairCare"
  | "habits"
  | "selfDev"
  | "onlineWork"
  | "achievements"
  | "concerns"
  | "workouts";

export type WellnessState = {
  calorieTarget: number;
  waterCups: number;
  waterGoal: number;
  weightKg: number;
  weightHistory: { date: string; kg: number }[];
  meals: WellnessItem[];
  skinCare: WellnessItem[];
  hairCare: WellnessItem[];
  habits: WellnessItem[];
  selfDev: WellnessItem[];
  onlineWork: WellnessItem[];
  achievements: WellnessItem[];
  concerns: WellnessItem[];
  workouts: WellnessItem[];
  sleepHours: number;
  mood: "great" | "good" | "meh" | "bad";
  steps: number;
  stepsGoal: number;
};


export type Theme = "light" | "dark";

export type BudgetSplit = { needs: number; wants: number; savings: number };

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  notes?: string;
};

export type PlanItem = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  icon?: string;
};

export type ExtraIncome = {
  id: string;
  source: string;
  amount: number;
  date: string;
  note?: string;
  icon?: string;
};

export type MonthData = {
  income: number;
  extraIncome: ExtraIncome[];
  urgent: UrgentExpense[];
  postponable: PostponableExpense[];
  debts: Debt[];
  monthlyPlan: PlanItem[];
  rewardClaimed: boolean;
  rewardNote?: string;
};

type State = {
  currentMonth: string; // YYYY-MM
  months: Record<string, MonthData>;
  wellness: WellnessState;
  theme: Theme;
  budgetSplit: BudgetSplit;
  savings: SavingsGoal[];
};

type Ctx = MonthData & {
  currentMonth: string;
  months: Record<string, MonthData>;
  monthKeys: string[];
  totalIncome: number;
  wellness: WellnessState;
  theme: Theme;
  budgetSplit: BudgetSplit;
  savings: SavingsGoal[];

  setCurrentMonth: (m: string) => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;

  setIncome: (n: number) => void;
  addExtraIncome: (e: Omit<ExtraIncome, "id">) => void;
  removeExtraIncome: (id: string) => void;

  addUrgent: (e: Omit<UrgentExpense, "id">) => void;
  updateUrgent: (id: string, patch: Partial<UrgentExpense>) => void;
  removeUrgent: (id: string) => void;
  payInstallmentMonth: (id: string) => void;

  addPostponable: (e: Omit<PostponableExpense, "id">) => void;
  removePostponable: (id: string) => void;
  moveToUrgent: (id: string) => void;

  addDebt: (d: Omit<Debt, "id" | "paid">) => void;
  payDebt: (id: string) => void;
  removeDebt: (id: string) => void;

  setWellness: (patch: Partial<WellnessState>) => void;
  toggleWellnessItem: (list: WellnessListKey, id: string) => void;
  addWellnessItem: (list: WellnessListKey, label: string) => void;
  renameWellnessItem: (list: WellnessListKey, id: string, label: string) => void;
  removeWellnessItem: (list: WellnessListKey, id: string) => void;

  toggleTheme: () => void;
  setBudgetSplit: (patch: Partial<BudgetSplit>) => void;

  addSavingsGoal: (g: Omit<SavingsGoal, "id" | "current"> & { current?: number }) => void;
  updateSavingsGoal: (id: string, patch: Partial<SavingsGoal>) => void;
  addToSavings: (id: string, amount: number) => void;
  removeSavingsGoal: (id: string) => void;

  addPlanItem: (p: Omit<PlanItem, "id" | "spent"> & { spent?: number }) => void;
  updatePlanItem: (id: string, patch: Partial<PlanItem>) => void;
  spendOnPlan: (id: string, amount: number) => void;
  resetPlanSpent: (id: string) => void;
  removePlanItem: (id: string) => void;

  claimReward: (note?: string) => void;
  unclaimReward: () => void;
};

const STORAGE_KEY = "monazem-masareefi-v2";
const LEGACY_KEY = "monazem-masareefi-v1";

const encouragements = [
  "أحسنتِ! خطوة ذكية نحو استقرارك المالي 💚",
  "رائع! التزامك يصنع الفرق 🌱",
  "ممتاز! كل سداد يقربك من هدفك ✨",
  "أنتِ على الطريق الصحيح، استمري! 🚀",
  "قرار موفق! ميزانيتك تشكرك 🙌",
  "الالتزام هو سر النجاح المالي 💎",
];
const pickEncouragement = () => encouragements[Math.floor(Math.random() * encouragements.length)];

const uid = () => Math.random().toString(36).slice(2, 10);

export function monthKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, 1);
  try {
    return new Intl.DateTimeFormat("ar", { month: "long", year: "numeric" }).format(date);
  } catch {
    return key;
  }
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1 + delta, 1);
  return monthKey(d);
}

const defaultWellness: WellnessState = {
  calorieTarget: 2000,
  waterCups: 0,
  waterGoal: 8,
  weightKg: 70,
  weightHistory: [],
  meals: [
    { id: "m1", label: "فطور صحي", done: false },
    { id: "m2", label: "غداء متوازن", done: false },
    { id: "m3", label: "عشاء خفيف", done: false },
    { id: "m4", label: "سناك فواكه", done: false },
  ],
  skinCare: [
    { id: "s1", label: "غسول الوجه", done: false },
    { id: "s3", label: "مرطب", done: false },
    { id: "s4", label: "واقي شمس", done: false },
  ],
  hairCare: [
    { id: "h1", label: "تمشيط الشعر", done: false },
    { id: "h2", label: "زيت الشعر", done: false },
    { id: "h3", label: "ماسك أسبوعي", done: false },
  ],
  habits: [
    { id: "hb1", label: "قراءة 10 دقائق", done: false },
    { id: "hb2", label: "تأمل", done: false },
    { id: "hb3", label: "المشي", done: false },
  ],
  selfDev: [
    { id: "sd1", label: "قراءة كتاب تطويري", done: false },
    { id: "sd2", label: "كورس / درس جديد", done: false },
    { id: "sd3", label: "تعلّم مهارة", done: false },
  ],
  onlineWork: [
    { id: "ow1", label: "الرد على العملاء", done: false },
    { id: "ow2", label: "نشر محتوى", done: false },
    { id: "ow3", label: "متابعة الطلبات", done: false },
  ],
  achievements: [
    { id: "ac1", label: "أنجزت مهمة كنت مؤجلتها 🎯", done: false },
  ],
  concerns: [
    { id: "cn1", label: "حبوب البشرة 🌸", done: false },
    { id: "cn2", label: "تساقط الشعر 💇‍♀️", done: false },
  ],
  workouts: [
    { id: "wk1", label: "سكوات × 15 🍑", done: false },
    { id: "wk2", label: "بلانك 30 ثانية 🪷", done: false },
    { id: "wk3", label: "تمرين ذراعين بأوزان خفيفة 💪", done: false },
    { id: "wk4", label: "إطالة 5 دقائق 🧘‍♀️", done: false },
  ],
  sleepHours: 7,
  mood: "good",
  steps: 0,
  stepsGoal: 8000,
};


function emptyMonth(income = 2000): MonthData {
  return {
    income,
    extraIncome: [],
    urgent: [],
    postponable: [],
    debts: [],
    monthlyPlan: [],
    rewardClaimed: false,
  };
}

function seedMonth(): MonthData {
  return {
    income: 2000,
    extraIncome: [],
    urgent: [
      { id: uid(), name: "الإيجار", amount: 800, dueDate: "", paid: false, category: "سكن" },
      { id: uid(), name: "فاتورة الكهرباء", amount: 120, dueDate: "", paid: false, category: "فواتير" },
      { id: uid(), name: "وقود السيارة", amount: 200, dueDate: "", paid: true, category: "مواصلات" },
    ],
    postponable: [
      { id: uid(), name: "ملابس جديدة", amount: 150, priority: "low" },
      { id: uid(), name: "قهوة", amount: 40, priority: "medium" },
    ],
    debts: [
      { id: uid(), creditor: "أحمد", amount: 300, dueDate: "", paid: false },
    ],
    monthlyPlan: [
      { id: uid(), category: "سكن وإيجار", amount: 800, spent: 0, icon: "🏠" },
      { id: uid(), category: "طعام وبقالة", amount: 400, spent: 0, icon: "🛒" },
      { id: uid(), category: "مواصلات", amount: 200, spent: 0, icon: "⛽" },
      { id: uid(), category: "قهوة", amount: 120, spent: 0, icon: "☕" },
      { id: uid(), category: "ادخار", amount: 300, spent: 0, icon: "🏦" },
    ],
    rewardClaimed: false,
  };
}

function defaultState(): State {
  const key = monthKey();
  return {
    currentMonth: key,
    months: { [key]: seedMonth() },
    wellness: defaultWellness,
    theme: "light",
    budgetSplit: { needs: 50, wants: 30, savings: 20 },
    savings: [
      { id: uid(), name: "صندوق الطوارئ", target: 5000, current: 1200 },
      { id: uid(), name: "رحلة صيفية", target: 3000, current: 500 },
    ],
  };
}

function normalizeMonth(m: Partial<MonthData> | undefined): MonthData {
  const base = emptyMonth();
  if (!m) return base;
  return {
    income: m.income ?? base.income,
    extraIncome: (m.extraIncome ?? []).map((x) => ({ ...x })),
    urgent: m.urgent ?? [],
    postponable: m.postponable ?? [],
    debts: m.debts ?? [],
    monthlyPlan: (m.monthlyPlan ?? []).map((p) => ({ ...p, spent: p.spent ?? 0 })),
    rewardClaimed: m.rewardClaimed ?? false,
    rewardNote: m.rewardNote,
  };
}

function loadState(): State {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const key = parsed.currentMonth || monthKey();
      const months: Record<string, MonthData> = {};
      for (const [k, v] of Object.entries(parsed.months ?? {})) {
        months[k] = normalizeMonth(v as Partial<MonthData>);
      }
      if (!months[key]) months[key] = emptyMonth();
      return {
        currentMonth: key,
        months,
        wellness: { ...defaultWellness, ...(parsed.wellness ?? {}) },
        theme: parsed.theme ?? "light",
        budgetSplit: parsed.budgetSplit ?? { needs: 50, wants: 30, savings: 20 },
        savings: parsed.savings ?? [],
      };
    }
    // migrate legacy v1
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const p = JSON.parse(legacy);
      const key = monthKey();
      const migrated: MonthData = normalizeMonth({
        income: p.income ?? 2000,
        extraIncome: [],
        urgent: p.urgent ?? [],
        postponable: p.postponable ?? [],
        debts: p.debts ?? [],
        monthlyPlan: p.monthlyPlan ?? [],
        rewardClaimed: false,
      });
      return {
        currentMonth: key,
        months: { [key]: migrated },
        wellness: { ...defaultWellness, ...(p.wellness ?? {}) },
        theme: p.theme ?? "light",
        budgetSplit: p.budgetSplit ?? { needs: 50, wants: 30, savings: 20 },
        savings: p.savings ?? [],
      };
    }
  } catch {}
  return defaultState();
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    if (state.theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [state, hydrated]);

  const value = useMemo<Ctx>(() => {
    const cm = state.months[state.currentMonth] ?? emptyMonth();

    const patchMonth = (patch: Partial<MonthData> | ((m: MonthData) => Partial<MonthData>)) =>
      setState((s) => {
        const prev = s.months[s.currentMonth] ?? emptyMonth();
        const delta = typeof patch === "function" ? patch(prev) : patch;
        return {
          ...s,
          months: { ...s.months, [s.currentMonth]: { ...prev, ...delta } },
        };
      });

    const totalIncome = cm.income + cm.extraIncome.reduce((a, b) => a + b.amount, 0);

    return {
      ...cm,
      currentMonth: state.currentMonth,
      months: state.months,
      monthKeys: Object.keys(state.months).sort(),
      totalIncome,
      wellness: state.wellness,
      theme: state.theme,
      budgetSplit: state.budgetSplit,
      savings: state.savings,

      setCurrentMonth: (m) =>
        setState((s) => ({
          ...s,
          currentMonth: m,
          months: s.months[m] ? s.months : { ...s.months, [m]: emptyMonth(s.months[s.currentMonth]?.income ?? 2000) },
        })),
      goPrevMonth: () => {
        const next = shiftMonth(state.currentMonth, -1);
        setState((s) => ({
          ...s,
          currentMonth: next,
          months: s.months[next] ? s.months : { ...s.months, [next]: emptyMonth(cm.income) },
        }));
      },
      goNextMonth: () => {
        const next = shiftMonth(state.currentMonth, 1);
        setState((s) => ({
          ...s,
          currentMonth: next,
          months: s.months[next] ? s.months : { ...s.months, [next]: emptyMonth(cm.income) },
        }));
      },

      setIncome: (n) => patchMonth({ income: Math.max(0, n) }),

      addExtraIncome: (e) => {
        toast.success("رصيد جديد أضيف! 💰", { description: `${e.source} — ${e.amount} ر.س` });
        patchMonth((m) => ({ extraIncome: [{ ...e, id: uid() }, ...m.extraIncome] }));
      },
      removeExtraIncome: (id) =>
        patchMonth((m) => ({ extraIncome: m.extraIncome.filter((x) => x.id !== id) })),

      addUrgent: (e) => patchMonth((m) => ({ urgent: [{ ...e, id: uid() }, ...m.urgent] })),
      updateUrgent: (id, patch) => {
        const before = cm.urgent.find((x) => x.id === id);
        if (before && patch.paid === true && !before.paid) {
          toast.success(pickEncouragement(), { description: `تم سداد: ${before.name}` });
        }
        patchMonth((m) => ({
          urgent: m.urgent.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
      },
      removeUrgent: (id) => patchMonth((m) => ({ urgent: m.urgent.filter((x) => x.id !== id) })),
      payInstallmentMonth: (id) =>
        patchMonth((m) => ({
          urgent: m.urgent.map((x) => {
            if (x.id !== id || !x.installment) return x;
            const next = Math.min(x.installment.monthsTotal, x.installment.monthsPaid + 1);
            if (next > x.installment.monthsPaid) {
              const left = x.installment.monthsTotal - next;
              toast.success("قسط جديد مسدد! 💪", {
                description: left === 0 ? `مبروك! انتهى التقسيط: ${x.name} 🎊` : `${x.name} — متبقي ${left} قسطًا`,
              });
            }
            return { ...x, installment: { ...x.installment, monthsPaid: next } };
          }),
        })),

      addPostponable: (e) => patchMonth((m) => ({ postponable: [{ ...e, id: uid() }, ...m.postponable] })),
      removePostponable: (id) => {
        const item = cm.postponable.find((x) => x.id === id);
        if (item) toast.success("قرار موفق! تخليتِ عن مصروف اختياري 💚", { description: item.name });
        patchMonth((m) => ({ postponable: m.postponable.filter((x) => x.id !== id) }));
      },
      moveToUrgent: (id) => {
        const item = cm.postponable.find((x) => x.id === id);
        if (!item) return;
        patchMonth((m) => ({
          postponable: m.postponable.filter((x) => x.id !== id),
          urgent: [
            {
              id: uid(),
              name: item.name,
              amount: item.amount,
              dueDate: new Date().toISOString().slice(0, 10),
              paid: false,
              notes: item.notes,
            },
            ...m.urgent,
          ],
        }));
      },

      addDebt: (d) => patchMonth((m) => ({ debts: [{ ...d, id: uid(), paid: false }, ...m.debts] })),
      payDebt: (id) => {
        const d = cm.debts.find((x) => x.id === id);
        if (d) toast.success("مبروك! دين أقل وراحة أكثر 🎉", { description: `تم سداد: ${d.creditor}` });
        patchMonth((m) => ({
          debts: m.debts.map((x) =>
            x.id === id ? { ...x, paid: true, paidDate: new Date().toISOString().slice(0, 10) } : x,
          ),
        }));
      },
      removeDebt: (id) => patchMonth((m) => ({ debts: m.debts.filter((x) => x.id !== id) })),

      setWellness: (patch) => setState((s) => ({ ...s, wellness: { ...s.wellness, ...patch } })),
      toggleWellnessItem: (list, id) =>
        setState((s) => ({
          ...s,
          wellness: {
            ...s.wellness,
            [list]: s.wellness[list].map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
          },
        })),
      addWellnessItem: (list, label) =>
        setState((s) => ({
          ...s,
          wellness: {
            ...s.wellness,
            [list]: [...s.wellness[list], { id: uid(), label, done: false }],
          },
        })),
      renameWellnessItem: (list, id, label) =>
        setState((s) => ({
          ...s,
          wellness: {
            ...s.wellness,
            [list]: s.wellness[list].map((x) => (x.id === id ? { ...x, label } : x)),
          },
        })),
      removeWellnessItem: (list, id) =>
        setState((s) => ({
          ...s,
          wellness: {
            ...s.wellness,
            [list]: s.wellness[list].filter((x) => x.id !== id),
          },
        })),

      toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
      setBudgetSplit: (patch) => setState((s) => ({ ...s, budgetSplit: { ...s.budgetSplit, ...patch } })),

      addSavingsGoal: (g) =>
        setState((s) => ({
          ...s,
          savings: [{ id: uid(), current: g.current ?? 0, ...g }, ...s.savings],
        })),
      updateSavingsGoal: (id, patch) =>
        setState((s) => ({
          ...s,
          savings: s.savings.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      addToSavings: (id, amount) => {
        if (amount > 0) {
          const g = state.savings.find((x) => x.id === id);
          if (g) toast.success("ادخار موفق! 🏦", { description: `${g.name} — أضفتِ ${amount} ر.س` });
        }
        setState((s) => ({
          ...s,
          savings: s.savings.map((x) =>
            x.id === id ? { ...x, current: Math.max(0, x.current + amount) } : x,
          ),
        }));
      },
      removeSavingsGoal: (id) =>
        setState((s) => ({ ...s, savings: s.savings.filter((x) => x.id !== id) })),

      addPlanItem: (p) =>
        patchMonth((m) => ({ monthlyPlan: [...m.monthlyPlan, { ...p, spent: p.spent ?? 0, id: uid() }] })),
      updatePlanItem: (id, patch) =>
        patchMonth((m) => ({ monthlyPlan: m.monthlyPlan.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      spendOnPlan: (id, amount) => {
        const item = cm.monthlyPlan.find((x) => x.id === id);
        if (item && amount > 0) {
          const newSpent = item.spent + amount;
          const remaining = item.amount - newSpent;
          if (remaining < 0) {
            toast.warning(`${item.icon ?? ""} ${item.category}`, {
              description: `تجاوزتِ الميزانية بمقدار ${Math.abs(remaining)} ر.س`,
            });
          } else {
            toast.success(`${item.icon ?? ""} ${item.category}`, {
              description: `صرفتِ ${amount} ر.س — متبقي ${remaining} ر.س`,
            });
          }
        }
        patchMonth((m) => ({
          monthlyPlan: m.monthlyPlan.map((x) =>
            x.id === id ? { ...x, spent: Math.max(0, x.spent + amount) } : x,
          ),
        }));
      },
      resetPlanSpent: (id) =>
        patchMonth((m) => ({ monthlyPlan: m.monthlyPlan.map((x) => (x.id === id ? { ...x, spent: 0 } : x)) })),
      removePlanItem: (id) =>
        patchMonth((m) => ({ monthlyPlan: m.monthlyPlan.filter((x) => x.id !== id) })),

      claimReward: (note) => {
        toast.success("مبروك! تستحقين هذي المكافأة 🎁✨", { description: note || "التزامك رائع هذا الشهر" });
        patchMonth({ rewardClaimed: true, rewardNote: note });
      },
      unclaimReward: () => patchMonth({ rewardClaimed: false, rewardNote: undefined }),
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function formatSAR(n: number) {
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n) + " ر.س";
}
