import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";
import { LayoutDashboard, Receipt, ChefHat, Grid3X3, ShieldCheck } from "lucide-react";

const features = [
  {
    id: "pos",
    label: "POS & Billing",
    icon: Receipt,
    headline: "Billing Ka Baazigar",
    description: "High-speed touchscreen POS with split-tender payments (Cash + UPI + Card) and instant thermal KOT dispatch.",
  },
  {
    id: "dashboard",
    label: "Live Operations",
    icon: LayoutDashboard,
    headline: "Complete Floor Intelligence",
    description: "Real-time revenue metrics, active table status, staff attendance, and comprehensive GST reports.",
  },
  {
    id: "kds",
    label: "Kitchen Display (KDS)",
    icon: ChefHat,
    headline: "Zero-Latency Kitchen Routing",
    description: "Instant ticket alerting for chefs, multi-station routing, order timers, and color-coded prep statuses.",
  },
  {
    id: "tables",
    label: "Tables & Floor Plan",
    icon: Grid3X3,
    headline: "Interactive Visual Floor Layout",
    description: "Visual floor plans, instant table merge, check splitting, and dynamic QR self-ordering.",
  },
] as const;

export function ProductShowcase() {
  const [active, setActive] = useState<(typeof features)[number]["id"]>("pos");
  const current = features.find((f) => f.id === active)!;
  const Icon = current.icon;

  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Engineered for Modern Restaurants
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Built for peak dinner rushes. Offline-capable, zero latency, and 100% self-hosted ownership.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-8 flex justify-center">
        <div
          role="tablist"
          aria-label="Product features"
          className="inline-flex flex-wrap justify-center gap-1.5 rounded-2xl border border-border/60 bg-muted/40 p-1.5"
        >
          {features.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active === f.id}
              onClick={() => setActive(f.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                active === f.id
                  ? "bg-background text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40",
              )}
            >
              <f.icon className="h-4 w-4 text-primary" />
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2} className="mt-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-background p-8 sm:p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto py-8">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
              <Icon className="h-10 w-10 text-primary animate-pulse" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              BillBaaz Restaurant Engine
            </span>

            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {current.headline}
            </h3>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {current.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-foreground/80">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1.5 border border-border">
                <ShieldCheck className="h-4 w-4 text-primary" /> 100% Offline Capability
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1.5 border border-border">
                <ShieldCheck className="h-4 w-4 text-primary" /> Sub-10ms Fast Settlement
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1.5 border border-border">
                <ShieldCheck className="h-4 w-4 text-primary" /> Dynamic Soundbox Voice
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
