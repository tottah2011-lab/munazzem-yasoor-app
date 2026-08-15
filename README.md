# منظم مالي راقٍ

Build a modern, elegant Arabic-first personal finance app with a premium UI. The design should be minimal, clean, and mobile-first, using soft colors (white, dark gray, emerald green, and light blue). Support RTL (Right-to-Left) perfectly.

App Name:

"منظم مصاريفي"

Main Features:

1. Dashboard (الرئيسية)

- Display monthly income.

- Default monthly income: 2000 SAR.

- Show remaining balance.

- Show total urgent expenses.

- Show total postponable expenses.

- Show unpaid debts.

- Show paid debts.

- Beautiful charts showing spending distribution.

- Progress bar showing monthly budget usage.

2. Monthly Income Settings

- Default income is 2000 SAR.

- User can edit monthly income anytime.

- Budget calculations update automatically.

3. Urgent Expenses (المصاريف العاجلة)

Examples:

- Rent

- Bills

- Fuel

- Food

- Medicine

Each expense should include:

- Name

- Amount

- Due date

- Paid / Unpaid status

- Notes

Display:

- Total urgent expenses

- Remaining after payment

4. Postponable Expenses (المصاريف القابلة للتأجيل)

Examples:

- Clothes

- Entertainment

- Electronics

- Gifts

- Coffee

- Shopping

Each item:

- Name

- Amount

- Priority

- Notes

Allow moving any item to urgent expenses.

5. Debts (الديون)

Each debt should include:

- Creditor name

- Amount

- Due date

- Notes

Button:

"Mark as Paid"

After payment, automatically move it to:

6. Paid Debts (الديون المسددة)

Display:

- Payment date

- Amount

- Creditor

- Total paid debts

7. Diet & Self-Care (الدايت والعناية)

A completely separate section.

Include:

Diet:

- Daily calorie target

- Water tracker

- Weight tracker

- Weekly progress

- Healthy meal checklist

Self Care:

- Skin care checklist

- Hair care checklist

- Sleep tracker

- Daily habits

- Mood tracker

- Exercise tracker

8. Monthly Reports

Generate reports including:

- Total income

- Total spending

- Savings

- Debt summary

- Spending by category

- Charts

9. Smart Budget Assistant

Automatically recommend:

- Spend less on postponable expenses.

- Pay urgent expenses first.

- Pay debts before optional purchases.

- Show estimated remaining balance until the end of the month.

10. Notifications

Reminder for:

- Due bills

- Debt payments

- Monthly budget

- Daily water intake

- Workout reminders

Design Requirements

- Beautiful rounded cards.

- Smooth animations.

- Glassmorphism effects.

- Dark Mode.

- Light Mode.

- Arabic font (Cairo).

- Responsive mobile design.

- Material Design icons.

Data

Store data locally.

Prepare architecture for future Firebase integration.

Budget Logic

Monthly Income = 2000 SAR

Priority:

1. Urgent expenses

2. Debts

3. Postponable expenses

Always calculate:

Remaining Balance =

Income − Urgent Expenses − Debts − Other Expenses

Highlight remaining balance:

Green if healthy.

Orange if below 30%.

Red if budget exceeded.

Extra Features

- Search.

- Expense filters.

- Monthly calendar.

- Export PDF reports.

- Backup & Restore.

- PIN lock.

- Fingerprint authentication support.

- Categories with icons.

- Add photos to expenses.

- Recurring monthly expenses.

- Savings goal tracker.

- Wish list for future purchases.

The entire application must be fully in Arabic with perfect RTL support and a polished, premium user experience comparable to top finance apps.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://munazzem-yasoor-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9df8a0ea-ad42-4613-b47a-223627165918).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
