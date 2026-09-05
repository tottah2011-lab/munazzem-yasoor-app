import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Home, Wallet, Heart, Moon, Sun, Settings, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { monthLabel, useStore } from "@/lib/store";

const nav = [
  { to: "/", label: "الرئيسية", icon: Home, emoji: "🏠" },
  { to: "/expenses", label: "المصاريف", icon: Wallet, emoji: "💳" },
  { to: "/planner", label: "التخطيط", icon: Sparkles, emoji: "✨" },
  { to: "/goals", label: "أهداف 2027", icon: Target, emoji: "🎯" },
  { to: "/wellness", label: "العناية", icon: Heart, emoji: "💖" },
] as const;


export function AppShell({
  title,
  subtitle,
  children,
  showMonth = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showMonth?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme, currentMonth, goPrevMonth, goNextMonth } = useStore();

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground pb-28">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-info/25 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-warning/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 glass px-5 pt-6 pb-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/settings"
              className="grid h-10 w-10 place-items-center rounded-full bg-card/80 text-foreground/70 transition hover:text-foreground"
              aria-label="الإعدادات"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-full bg-card/80 text-foreground/70 transition hover:text-foreground"
              aria-label="الوضع"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showMonth && (
          <div className="mx-auto mt-4 flex max-w-xl items-center justify-between gap-2 rounded-full bg-card/70 p-1.5 shadow-soft">
            <button
              onClick={goPrevMonth}
              className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              aria-label="الشهر السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">شهر التخطيط 🗓️</p>
              <p className="text-sm font-bold">{monthLabel(currentMonth)}</p>
            </div>
            <button
              onClick={goNextMonth}
              className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground shadow-soft"
              aria-label="الشهر التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-xl px-5 pt-6">{children}</main>






      <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
        <div className="glass flex items-center gap-1 rounded-full px-2 py-2 shadow-elegant">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[10px] font-medium transition ${
                  active
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-6 mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold">{children}</h2>
      {action}
    </div>
  );
}
