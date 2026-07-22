import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UrgentExpense = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  notes?: string;
  category?: string;
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

export type WellnessState = {
  calorieTarget: number;
  waterCups: number;
  waterGoal: number;
  weightKg: number;
  weightHistory: { date: string; kg: number }[];
  meals: { id: string; label: string; done: boolean }[];
  skinCare: { id: string; label: string; done: boolean }[];
  hairCare: { id: string; label: string; done: boolean }[];
  habits: { id: string; label: string; done: boolean }[];
  sleepHours: number;
  mood: "great" | "good" | "meh" | "bad";
  exerciseMinutes: number;
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

export type AlinmaLoan = {
  totalAmount: number;
  monthlyInstallment: number;
  monthsTotal: number;
  monthsPaid: number;
  startDate?: string;
  notes?: string;
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
  alinma: AlinmaLoan;
};

type Ctx = State & {
  setIncome: (n: number) => void;
  addUrgent: (e: Omit<UrgentExpense, "id">) => void;
  updateUrgent: (id: string, patch: Partial<UrgentExpense>) => void;
  removeUrgent: (id: string) => void;
  addPostponable: (e: Omit<PostponableExpense, "id">) => void;
  removePostponable: (id: string) => void;
  moveToUrgent: (id: string) => void;
  addDebt: (d: Omit<Debt, "id" | "paid">) => void;
  payDebt: (id: string) => void;
  removeDebt: (id: string) => void;
  setWellness: (patch: Partial<WellnessState>) => void;
  toggleWellnessItem: (list: "meals" | "skinCare" | "hairCare" | "habits", id: string) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "monazem-masareefi-v1";

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
    { id: "s2", label: "تونر", done: false },
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
  exerciseMinutes: 0,
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
        setState((s) => ({
          ...s,
          urgent: s.urgent.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeUrgent: (id) => setState((s) => ({ ...s, urgent: s.urgent.filter((x) => x.id !== id) })),
      addPostponable: (e) =>
        setState((s) => ({ ...s, postponable: [{ ...e, id: uid() }, ...s.postponable] })),
      removePostponable: (id) =>
        setState((s) => ({ ...s, postponable: s.postponable.filter((x) => x.id !== id) })),
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
        setState((s) => ({
          ...s,
          debts: s.debts.map((x) =>
            x.id === id
              ? { ...x, paid: true, paidDate: new Date().toISOString().slice(0, 10) }
              : x,
          ),
        })),
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
      toggleTheme: () =>
        setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
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
