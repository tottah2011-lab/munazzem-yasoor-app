import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarX2, Compass, HeartHandshake, PiggyBank, Sparkles, Wallet, Zap } from "lucide-react";
import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { formatSAR, useStore } from "@/lib/store";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "توجيهي المالي — منظم مصاريفي" },
      { name: "description", content: "دليل بسيط يوجّهك خطوة بخطوة لإدارة راتبك والتزاماتك ومدخراتك." },
      { property: "og:title", content: "توجيهي المالي 🧭" },
      { property: "og:description", content: "خطوات سهلة تخليك تديرين مصاريفك بثقة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidePage,
});

const steps = [
  {
    emoji: "1️⃣",
    title: "ابدئي بالسداد يوم 1",
    body: "موعد السداد ثابت: أول يوم في الشهر. سدّدي التزاماتك وأقساطك أول ما ينزل الراتب، قبل أي صرف ثاني.",
  },
  {
    emoji: "2️⃣",
    title: "افصلي الأقساط عن الالتزامات",
    body: "الأقساط لها نهاية محددة، والالتزامات تتكرر كل شهر. اعرفي مجموعهم عشان تعرفين كم يتبقى لك فعليًا.",
  },
  {
    emoji: "3️⃣",
    title: "خطة الإنفاق أولًا",
    body: "قسّمي المتبقي على بنود واضحة (بقالة، قهوة، مواصلات…) وكل ما تصرفين سجّلي المبلغ عشان تشوفين الرصيد ينقص بصدق.",
  },
  {
    emoji: "4️⃣",
    title: "الصرف الطارئ بحذر",
    body: "أي مصروف مفاجئ سجّليه، وإذا كان عشوائي علّميه ⚠️ — التعليم مو عقاب، هو مرآة تساعدك الشهر الجاي.",
  },
  {
    emoji: "5️⃣",
    title: "الدخل الإضافي = ادخار",
    body: "العمل الحر والمبالغ الإضافية ما تُحسب مع راتبك الشهري، خليها تروح للادخار مباشرة وبيكبر رصيدك بسرعة.",
  },
  {
    emoji: "6️⃣",
    title: "الأحلام لها قائمتها",
    body: "أشياء تبغين تشترينها ما تُخصم من دخلك — اشتريها لما يسمح الفائض، وبتنشطب بفرح وتبقى في قائمتك كذكرى 🎀",
  },
  {
    emoji: "7️⃣",
    title: "الفائض ➜ ادخار",
    body: "آخر الشهر حوّلي الفائض للادخار بدل ما يضيع. حتى 50 ريال شهريًا تصير مبلغ يفرح بعد سنة.",
  },
];

function GuidePage() {
  const { totalIncome, urgent, dailyExpenses, extrasTotal, surplusTotal, isLate, daysLate, paymentDueDate } = useStore();

  const installments = urgent.filter((x) => x.installment && x.installment.monthsTotal > 0);
  const commitments = urgent.filter((x) => !x.installment || x.installment.monthsTotal === 0);
  const installmentMonthly = installments.reduce((a, b) => a + b.amount, 0);
  const commitmentsTotal = commitments.reduce((a, b) => a + b.amount, 0);
  const emergency = dailyExpenses.reduce((a, b) => a + b.amount, 0);
  const free = totalIncome - installmentMonthly - commitmentsTotal - emergency;

  const advice =
    free < 0
      ? "صرفك تجاوز راتبك 💗 راجعي الصرف العشوائي وأجّلي أي شي من قائمة الأحلام."
      : free < totalIncome * 0.15
        ? "المتبقي بسيط — خلي صرفك على الأساسيات فقط لين نهاية الشهر."
        : "وضعك ممتاز! خصّصي جزء من المتبقي للادخار قبل ما يُصرف ✨";

  return (
    <AppShell title="توجيهي المالي 🧭" subtitle="خطوات بسيطة تديرين فيها فلوسك بثقة">
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-6 text-primary-foreground shadow-elegant">
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Compass className="h-4 w-4" />
          <span>توصية اليوم</span>
        </div>
        <p className="mt-2 text-lg font-bold leading-relaxed">{advice}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">متاح للصرف</p>
            <p className="mt-0.5 font-bold">{formatSAR(Math.max(0, free))}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">التزامات + أقساط</p>
            <p className="mt-0.5 font-bold">{formatSAR(commitmentsTotal + installmentMonthly)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2 text-center">
            <p className="opacity-80">مدخراتك</p>
            <p className="mt-0.5 font-bold">{formatSAR(extrasTotal + surplusTotal)}</p>
          </div>
        </div>
      </div>

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
          <p className="text-sm font-bold">فترة السداد ثابتة: 1 من كل شهر</p>
          <p className={`mt-0.5 text-xs ${isLate ? "text-destructive" : "text-muted-foreground"}`}>
            {isLate ? `تأخرتِ ${daysLate} يوم عن ${paymentDueDate} ⚠️` : `الاستحقاق ${paymentDueDate} 💚`}
          </p>
        </div>
      </Card>

      <SectionTitle>خطوات إدارة مصاريفك 💡</SectionTitle>
      <div className="space-y-2">
        {steps.map((s) => (
          <Card key={s.title} className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-muted text-lg">{s.emoji}</div>
            <div className="min-w-0">
              <p className="font-bold">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>روحي مباشرة 🚀</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <QuickLink to="/expenses" label="خزنة مصاريفي" icon={Wallet} />
        <QuickLink to="/planner" label="خطة الشهر" icon={PiggyBank} />
        <QuickLink to="/expenses" label="سجّلي صرف طارئ" icon={Zap} />
        <QuickLink to="/wellness" label="عنايتي بنفسي" icon={HeartHandshake} />
      </div>

      <Card className="mt-5 flex items-center gap-3 border border-success/20 bg-success/5">
        <Sparkles className="h-5 w-5 shrink-0 text-success" />
        <p className="text-sm leading-relaxed">
          تذكّري: مو المطلوب تكونين مثالية، المطلوب تكونين واعية 💗
        </p>
      </Card>
    </AppShell>
  );
}

function QuickLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Wallet }) {
  return (
    <Link to={to} className="glass flex items-center gap-2 rounded-3xl p-4 transition hover:scale-[1.02]">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{label}</span>
      <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
