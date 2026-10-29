import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "POS Features" },
      { href: "#pricing", label: "Plans & Pricing" },
      { href: "/signup", label: "Start Free Trial" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/signup", label: "Dine-in Restaurants" },
      { href: "/signup", label: "Cloud Kitchens" },
      { href: "/signup", label: "Cafes & QSR" },
      { href: "/signup", label: "Multi-branch Franchises" },
    ],
  },
  {
    title: "Company & Access",
    links: [
      { href: "/login", label: "Restaurant Login" },
      { href: "/signup", label: "Register New Outlet" },
      { href: "https://nighwantech.com", label: "Nighwan Technology" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={32} />
              <div className="flex flex-col">
                <span className="text-base font-bold text-foreground">BillBaaz</span>
                <span className="text-[10px] text-muted-foreground font-medium">Billing ka baazigar</span>
              </div>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Commercial restaurant operating system, high-speed billing POS, and online order aggregator terminal.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {col.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BillBaaz. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with pride in India by{" "}
            <a
              href="https://nighwantech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
            >
              Nighwan Technology Pvt. Ltd. (nighwantech.com)
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
