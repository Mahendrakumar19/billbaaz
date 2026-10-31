"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@billbaaz/types";
import { hasPermission } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { ShieldCheck } from "lucide-react";
import { NavDot } from "./nav-dot";
import { NAV_ITEMS } from "./nav-items";

export function SidebarNav({
  user,
  onNavigate,
}: {
  user?: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const badges = useNavBadges();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.filter((item) => !item.permission || hasPermission(user, item.permission)).map(
        (item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {t(item.labelKey)}
              {badges.nav[item.href] && !isActive ? <NavDot /> : null}
            </Link>
          );
        },
      )}
      {(user?.isSuperAdmin || user?.isPlatformOwner) && (
        <div className="mt-3 pt-3 border-t border-sidebar-border">
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
              pathname?.startsWith("/admin")
                ? "bg-amber-500 text-white shadow-sm"
                : "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20",
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={2.5} />
            <span>Master Super-Admin</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
