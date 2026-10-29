import { Heart } from "lucide-react";

export function BrandFooter() {
  return (
    <div className="flex flex-col gap-1.5 border-t border-sidebar-border px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-sidebar-foreground">
        <span>BillBaaz</span>
        <span className="text-[10px] font-normal text-muted-foreground">· Billing ka baazigar</span>
      </div>
      <p className="flex items-center gap-1 text-[11px] leading-tight text-sidebar-foreground/70">
        <span>Made with</span>
        <Heart className="h-3 w-3 fill-rose-500 text-rose-500 inline shrink-0" />
        <span>in India by</span>
      </p>
      <a
        href="https://nighwantech.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-medium text-primary hover:underline hover:text-primary/90 transition-colors"
      >
        Nighwan Technology
      </a>
    </div>
  );
}
