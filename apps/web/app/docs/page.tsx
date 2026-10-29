import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, DocSection } from "@/components/marketing/doc-page";

export const metadata: Metadata = {
  title: "Documentation — BillBaaz",
  description: "API & Integrations, accessibility, and India compliance docs for BillBaaz — Billing ka baazigar.",
};

const docs = [
  {
    href: "/docs/api",
    title: "API & Integrations",
    description: "Connect an external website or system to use BillBaaz as a backend.",
  },
  {
    href: "/docs/accessibility",
    title: "Accessibility",
    description: "How BillBaaz is built to work with keyboards, screen readers, and reduced motion.",
  },
  {
    href: "/docs/compliance-india",
    title: "India compliance",
    description: "GST, receipts, and data-residency notes for running BillBaaz in India.",
  },
];

export default function DocsIndexPage() {
  return (
    <DocPage title="Documentation" updated="October 2026">
      <DocSection heading="Guides">
        <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60">
          {docs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="flex flex-col gap-1 p-4 transition-colors hover:bg-secondary"
            >
              <span className="text-sm font-medium text-foreground">{doc.title}</span>
              <span className="text-sm text-muted-foreground">{doc.description}</span>
            </Link>
          ))}
        </div>
      </DocSection>

      <DocSection heading="BillBaaz Architecture">
        <p>
          BillBaaz runs as an offline-first system on your local LAN with PostgreSQL, NestJS API, and Next.js interface.
        </p>
      </DocSection>
    </DocPage>
  );
}
