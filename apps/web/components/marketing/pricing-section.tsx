"use client";

import { Check, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: "Starter Outlet",
      tagline: "Perfect for cafes, bakeries, food trucks, and small dine-ins.",
      priceMonthly: "₹999",
      priceYearly: "₹799",
      billedNote: "billed annually (₹7,999/yr)",
      popular: false,
      features: [
        "Lightning fast Billing & POS",
        "Unlimited Orders & KOTs",
        "Table Layout & Dine-in Floor Management",
        "Dynamic UPI QR (0% MDR, straight to your bank)",
        "Raw ESC/POS Thermal Printing (USB / LAN / Bluetooth)",
        "Daily Sales & GST Summary Reports",
        "Staff PIN Fast Login & Access Control",
      ],
      ctaText: "Start 14-Day Free Trial",
      ctaHref: "/signup",
    },
    {
      name: "Pro Restaurant",
      tagline: "The complete all-in-one operating system to dominate your local market.",
      priceMonthly: "₹1,599",
      priceYearly: "₹1,299",
      billedNote: "billed annually (₹12,999/yr)",
      popular: true,
      features: [
        "Everything in Starter Outlet, plus:",
        "🛵 Unified Zomato & Swiggy Live Order Hub",
        "💬 Instant Customer WhatsApp Digital Invoices",
        "🍳 Kitchen Display System (KDS) for Chefs",
        "📦 Inventory & Raw Ingredient Recipe Costing",
        "📱 QR Self-Order Menu for Guest Tables",
        "📊 Daily Owner EOD Sales Digest on WhatsApp",
        "24/7 Priority WhatsApp & Phone Support",
      ],
      ctaText: "Claim Pro Plan Trial",
      ctaHref: "/signup",
    },
    {
      name: "Enterprise & Chains",
      tagline: "For multi-outlet franchises, cloud kitchen networks, and fine-dines.",
      priceMonthly: "₹2,999",
      priceYearly: "₹2,499",
      billedNote: "per outlet / billed annually",
      popular: false,
      features: [
        "Everything in Pro Restaurant, plus:",
        "Multi-branch Centralized Menu & Stock Sync",
        "Custom Whitelabel Domain (yourbrand.com)",
        "Pine Labs / Mswipe EDC Card Machine Bridge",
        "Paytm & PhonePe Soundbox Voice Relay",
        "Dedicated Account Manager from Nighwan Tech",
        "On-premise / Custom Cloud Installation",
        "Custom Feature Development & SLA",
      ],
      ctaText: "Talk to Enterprise Sales",
      ctaHref: "/signup",
    },
  ];

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      {/* Header */}
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Transparent Pricing · Zero Hidden Fees
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Sell more food. Save ₹30,000+ every year.
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          No extra charge for Zomato &amp; Swiggy. No 25 paise per SMS fee. No payment gateway cuts.
          Switch from legacy software to BillBaaz today.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isYearly}
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isYearly ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isYearly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
          </span>
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
            Save 20% + Free Onboarding
          </span>
        </div>
      </Reveal>

      {/* Pricing Cards */}
      <RevealGroup className="mt-14 grid gap-8 lg:grid-cols-3">
        {plans.map((p) => (
          <RevealItem key={p.name} className="flex">
            <div
              className={`relative flex w-full flex-col justify-between rounded-3xl border p-8 transition-all ${
                p.popular
                  ? "border-primary bg-card shadow-xl ring-2 ring-primary/30 lg:-translate-y-2"
                  : "border-border/70 bg-card/60 hover:border-border"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground flex items-center gap-1 shadow-md">
                  <Flame className="size-3.5 fill-current" />
                  MOST POPULAR
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">
                    {isYearly ? p.priceYearly : p.priceMonthly}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">/ month</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {isYearly ? p.billedNote : "billed monthly, cancel anytime"}
                </p>

                <div className="my-6 border-t border-border/50" />

                <ul className="space-y-3 text-xs text-foreground/90">
                  {p.features.map((feat, idx) => {
                    const isBold = feat.startsWith("🛵") || feat.startsWith("💬") || feat.startsWith("Everything");
                    return (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="size-4 shrink-0 text-success mt-0.5" />
                        <span className={isBold ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {feat}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  render={<Link href={p.ctaHref} />}
                  variant={p.popular ? "default" : "outline"}
                  className="w-full h-11 text-sm font-semibold rounded-xl"
                >
                  {p.ctaText}
                </Button>
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Comparison: BillBaaz vs PetPooja */}
      <Reveal className="mt-20 rounded-3xl border border-border/80 bg-muted/20 p-8 sm:p-10">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground">
            Why India&apos;s Restaurants Are Switching to BillBaaz
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Compare honest numbers. Stop paying hidden renewal taxes.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="py-3 px-4 font-semibold">Feature / Capability</th>
                <th className="py-3 px-4 font-semibold text-destructive">PetPooja / Traditional POS</th>
                <th className="py-3 px-4 font-bold text-primary">BillBaaz (Nighwan Tech)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              <tr>
                <td className="py-3.5 px-4 font-medium">Zomato &amp; Swiggy Online Relay</td>
                <td className="py-3.5 px-4 text-muted-foreground">₹3,000 to ₹5,000/yr extra add-on</td>
                <td className="py-3.5 px-4 font-semibold text-success">✓ 100% Free &amp; Built-in</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Customer WhatsApp Digital Invoicing</td>
                <td className="py-3.5 px-4 text-muted-foreground">25p – 40p per SMS + DLT hassle</td>
                <td className="py-3.5 px-4 font-semibold text-success">✓ 1-Click WhatsApp Bills</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Dynamic UPI QR (Direct-to-Bank)</td>
                <td className="py-3.5 px-4 text-muted-foreground">1.5% - 2% Payment Gateway MDR</td>
                <td className="py-3.5 px-4 font-semibold text-success">✓ 0% MDR (Straight into your bank)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Hardware Dependency</td>
                <td className="py-3.5 px-4 text-muted-foreground">Proprietary driver locks</td>
                <td className="py-3.5 px-4 font-semibold text-success">✓ Any Phone, Tablet, PC or Thermal Printer</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium">Out of Stock (86 Item) 1-Click Toggle</td>
                <td className="py-3.5 px-4 text-muted-foreground">Multi-screen deep menu navigation</td>
                <td className="py-3.5 px-4 font-semibold text-success">✓ Instant 1-tap &quot;86 Out&quot; on Menu screen</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* Direct Call-to-Action Banner */}
      <Reveal className="mt-12 rounded-3xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-xl font-bold text-foreground">Ready to take your restaurant to the next level?</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Sign up now and start billing with zero setup fee and a 14-day risk-free trial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button render={<Link href="/signup" />} className="rounded-xl h-11 px-6 text-sm font-semibold">
            Start 14-Day Free Trial &rarr;
          </Button>
          <Button variant="outline" render={<Link href="/login" />} className="rounded-xl h-11 px-5 text-sm">
            Restaurant Sign In
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

