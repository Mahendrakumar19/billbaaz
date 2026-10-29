import { LifeBuoy } from "lucide-react";

export function BrandFooter() {
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-sidebar-foreground">
        <span>BillBaaz</span>
        <span className="text-[10px] font-normal text-muted-foreground">· Billing ka baazigar</span>
      </div>
      <p className="text-[11px] leading-tight text-sidebar-foreground/60">
        Professional Restaurant POS
      </p>
    </div>
  );
}
