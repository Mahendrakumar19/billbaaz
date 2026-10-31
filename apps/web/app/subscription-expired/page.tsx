"use client";

import {
  AlertTriangle,
  Building2,
  ExternalLink,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

export default function SubscriptionExpiredPage() {
  const { data } = useCurrentUser();
  const user = data?.user;
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Main Card */}
        <Card className="border-border shadow-2xl overflow-hidden">
          <div className="bg-destructive/10 border-b border-destructive/20 p-6 flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shadow-inner">
              <Lock className="size-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-destructive/80">
                License Notice · BillBaaz POS
              </span>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                Subscription Inactive / Expired
              </h1>
            </div>
          </div>

          <CardContent className="p-6 flex flex-col gap-5 text-sm">
            <div className="text-center text-muted-foreground text-xs leading-relaxed">
              Billing counter, kitchen display (KDS), and online order operations for{" "}
              <strong className="text-foreground">{user?.name || "your restaurant"}</strong> are currently paused.
            </div>

            {/* Why this happened */}
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 flex flex-col gap-2 text-xs">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-500" />
                Why is my software locked?
              </div>
              <p className="text-muted-foreground leading-normal">
                Your monthly or annual SaaS billing subscription validity has ended, or payment is pending clearance.
              </p>
            </div>

            {/* How to reactivate */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                How to Restore Access Instantly:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <a
                  href="https://wa.me/919999999999?text=Hello%2C%20I%20want%20to%20renew%20my%20BillBaaz%20POS%20subscription"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold transition-colors"
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span>WhatsApp Support</span>
                </a>

                <a
                  href="mailto:support@nighwantech.com?subject=BillBaaz%20Subscription%20Renewal"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background hover:bg-muted font-medium transition-colors"
                >
                  <Mail className="size-4 shrink-0 text-primary" />
                  <span>support@nighwantech.com</span>
                </a>
              </div>
            </div>

            {/* Powered By Nighwan Technology attribution */}
            <div className="text-center pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
              Official Restaurant Management Software by{" "}
              <a
                href="https://nighwantech.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Nighwan Technology Pvt. Ltd.
              </a>
            </div>

            {/* Log out */}
            <div className="flex justify-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <LogOut className="size-3.5" />
                Sign in with another account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
