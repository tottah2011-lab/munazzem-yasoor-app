import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type UrgentExpense = {
  id: string;
  name: string;
  amount: number; // monthly amount (or single-payment amount)
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

export type WellnessListKey = "meals" | "skinCare" | "hairCare" | "habits";

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
  sleepHours: number;
  mood: "great" | "good" | "meh" | "bad";
  steps: number;
  stepsGoal: number;
};

export type Theme = "light" | "dark";

export type BudgetSplit = {
  needs: number;
  wants: number;
  savings: number;
};

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
  amount: number; // monthly budget
  spent: number; // used so far this month
  icon?: string;
};

type State = {
  income: number;
  urgent: UrgentExpense[];
  postponable: PostponableExpense[];
  debts: Debt[];
  wellness: WellnessState;
  theme: Theme;
  budgetSplit: BudgetSplit;
  savings: SavingsGoal[];
  monthlyPlan: PlanItem[];
};

type Ctx = State & {
  setIncome: (n: number) => void;
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
};

const STORAGE_KEY = "monazem-masareefi-v1";

const encouragements = [
  "أحسنت! خطوة ذكية نحو استقرارك المالي 💚",
  "رائع! التزامك يصنع الفرق 🌱",
  "ممتاز! كل سداد يقربك من هدفك ✨",
  "أنت على الطريق الصحيح، استمر! 🚀",
  "قرار موفق! ميزانيتك تشكرك 🙌",
  "الالتزام هو سر النجاح المالي 💎",
];
const pickEncouragement = () => encouragements[Math.floor(Math.random() * encouragements.length)];

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
  sleepHours: 7,
  mood: "good",
  steps: 0,
  stepsGoal: 8000,
};

const defaultState: State = {
  income: 2000,
  urgent: [
    { id: "u1", name: "الإيجار", amount: 800, dueDate: "2026-08-01", paid: false, category: "سكن" },
    { id: "u2", name: "فاتورة الكهرباء", amount: 120, dueDate: "2026-08-05", paid: false, category: "فواتير" },
    { id: "u3", name: "وقود السيارة", amount: 200, dueDate: "2026-08-10", paid: true, category: "مواصلات" },
  ],
  postponable: [
    { id: "p1", name: "ملابس جديدة", amount: 150, priority: "low" },
    { id: "p2", name: "قهوة", amount: 40, priority: "medium" },
  ],
  debts: [
    { id: "d1", creditor: "أحمد", amount: 300, dueDate: "2026-08-15", paid: false },
  ],
  wellness: defaultWellness,
  theme: "light",
  budgetSplit: { needs: 50, wants: 30, savings: 20 },
  savings: [
    { id: "sv1", name: "صندوق الطوارئ", target: 5000, current: 1200 },
    { id: "sv2", name: "رحلة صيفية", target: 3000, current: 500 },
  ],
  monthlyPlan: [
    { id: "pl1", category: "سكن وإيجار", amount: 800, spent: 0, icon: "🏠" },
    { id: "pl2", category: "طعام وبقالة", amount: 400, spent: 0, icon: "🛒" },
    { id: "pl3", category: "مواصلات", amount: 200, spent: 0, icon: "⛽" },
    { id: "pl4", category: "قهوة", amount: 120, spent: 0, icon: "☕" },
    { id: "pl5", category: "ادخار", amount: 300, spent: 0, icon: "🏦" },
  ],
};

const StoreContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

function loadState(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      wellness: { ...defaultWellness, ...(parsed.wellness ?? {}) },
      monthlyPlan: (parsed.monthlyPlan ?? defaultState.monthlyPlan).map((p: PlanItem) => ({
        spent: 0,
        ...p,
      })),
    };
  } catch {
    return defaultState;
  }
}

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
    if (state.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state, hydrated]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      setIncome: (n) => setState((s) => ({ ...s, income: Math.max(0, n) })),
      addUrgent: (e) => setState((s) => ({ ...s, urgent: [{ ...e, id: uid() }, ...s.urgent] })),
      updateUrgent: (id, patch) =>
        setState((s) => {
          const before = s.urgent.find((x) => x.id === id);
          if (before && patch.paid === true && !before.paid) {
            toast.success(pickEncouragement(), { description: `تم سداد: ${before.name}` });
          }
          return {
            ...s,
            urgent: s.urgent.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          };
        }),
      removeUrgent: (id) => setState((s) => ({ ...s, urgent: s.urgent.filter((x) => x.id !== id) })),
      payInstallmentMonth: (id) =>
        setState((s) => ({
          ...s,
          urgent: s.urgent.map((x) => {
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
      addPostponable: (e) =>
        setState((s) => ({ ...s, postponable: [{ ...e, id: uid() }, ...s.postponable] })),
      removePostponable: (id) => {
        setState((s) => {
          const item = s.postponable.find((x) => x.id === id);
          if (item) toast.success("قرار موفق! تخليت عن مصروف اختياري 💚", { description: item.name });
          return { ...s, postponable: s.postponable.filter((x) => x.id !== id) };
        });
      },
      moveToUrgent: (id) =>
        setState((s) => {
          const item = s.postponable.find((x) => x.id === id);
          if (!item) return s;
          return {
            ...s,
            postponable: s.postponable.filter((x) => x.id !== id),
            urgent: [
              {
                id: uid(),
                name: item.name,
                amount: item.amount,
                dueDate: new Date().toISOString().slice(0, 10),
                paid: false,
                notes: item.notes,
              },
              ...s.urgent,
            ],
          };
        }),
      addDebt: (d) =>
        setState((s) => ({ ...s, debts: [{ ...d, id: uid(), paid: false }, ...s.debts] })),
      payDebt: (id) =>
        setState((s) => {
          const d = s.debts.find((x) => x.id === id);
          if (d) toast.success("مبروك! دين أقل وراحة أكثر 🎉", { description: `تم سداد: ${d.creditor}` });
          return {
            ...s,
            debts: s.debts.map((x) =>
              x.id === id ? { ...x, paid: true, paidDate: new Date().toISOString().slice(0, 10) } : x,
            ),
          };
        }),
      removeDebt: (id) => setState((s) => ({ ...s, debts: s.debts.filter((x) => x.id !== id) })),
      setWellness: (patch) =>
        setState((s) => ({ ...s, wellness: { ...s.wellness, ...patch } })),
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
      toggleTheme: () =>
        setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
      setBudgetSplit: (patch) =>
        setState((s) => ({ ...s, budgetSplit: { ...s.budgetSplit, ...patch } })),
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
        setState((s) => {
          if (amount > 0) {
            const g = s.savings.find((x) => x.id === id);
            if (g) toast.success("ادخار موفق! 🏦", { description: `${g.name} — أضفت ${amount} ر.س` });
          }
          return {
            ...s,
            savings: s.savings.map((x) =>
              x.id === id ? { ...x, current: Math.max(0, x.current + amount) } : x,
            ),
          };
        });
      },
      removeSavingsGoal: (id) =>
        setState((s) => ({ ...s, savings: s.savings.filter((x) => x.id !== id) })),
      addPlanItem: (p) =>
        setState((s) => ({ ...s, monthlyPlan: [...s.monthlyPlan, { ...p, spent: p.spent ?? 0, id: uid() }] })),
      updatePlanItem: (id, patch) =>
        setState((s) => ({
          ...s,
          monthlyPlan: s.monthlyPlan.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      spendOnPlan: (id, amount) =>
        setState((s) => {
          const item = s.monthlyPlan.find((x) => x.id === id);
          if (item && amount > 0) {
            const newSpent = item.spent + amount;
            const remaining = item.amount - newSpent;
            if (remaining < 0) {
              toast.warning(`${item.icon ?? ""} ${item.category}`, {
                description: `تجاوزت الميزانية بمقدار ${Math.abs(remaining)} ر.س`,
              });
            } else {
              toast.success(`${item.icon ?? ""} ${item.category}`, {
                description: `صرفت ${amount} ر.س — متبقي ${remaining} ر.س`,
              });
            }
          }
          return {
            ...s,
            monthlyPlan: s.monthlyPlan.map((x) =>
              x.id === id ? { ...x, spent: Math.max(0, x.spent + amount) } : x,
            ),
          };
        }),
      resetPlanSpent: (id) =>
        setState((s) => ({
          ...s,
          monthlyPlan: s.monthlyPlan.map((x) => (x.id === id ? { ...x, spent: 0 } : x)),
        })),
      removePlanItem: (id) =>
        setState((s) => ({ ...s, monthlyPlan: s.monthlyPlan.filter((x) => x.id !== id) })),
    }),
    [state],
  );

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
