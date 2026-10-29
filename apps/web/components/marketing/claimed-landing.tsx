import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export function ClaimedLanding() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <Logo size={56} />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
        BillBaaz
      </h1>
      <p className="mt-1 font-medium text-primary text-sm">
        Billing ka baazigar
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your restaurant system is running and ready. Sign in to your dashboard to start billing.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button size="lg" render={<Link href="/login" />}>
          Sign in
        </Button>
        <Button variant="outline" size="lg" render={<Link href="/docs" />}>
          Documentation
        </Button>
      </div>
    </div>
  );
}
