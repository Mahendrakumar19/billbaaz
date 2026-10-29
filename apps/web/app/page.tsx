"use client";

import { MotionConfig } from "motion/react";
import { AuthRedirectGate } from "@/components/marketing/auth-redirect-gate";
import { Features } from "@/components/marketing/features";
import { Hero } from "@/components/marketing/hero";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { PricingSection } from "@/components/marketing/pricing-section";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { SecuritySection } from "@/components/marketing/security-section";

export default function MarketingHomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-full flex-col">
        <AuthRedirectGate />
        <MarketingNav />
        <main id="main-content">
          <Hero />
          <ProductShowcase />
          <Features />
          <SecuritySection />
          <PricingSection />
        </main>
        <MarketingFooter />
      </div>
    </MotionConfig>
  );
}
