export function BrandFooter() {
  return (
    <div className="flex flex-col gap-1.5 border-t border-sidebar-border px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-sidebar-foreground">
        <span>BillBaaz</span>
        <span className="text-[10px] font-normal text-muted-foreground">· Billing ka baazigar</span>
      </div>
      <p className="text-[11px] leading-relaxed text-sidebar-foreground/75">
        Made with pride in India by{" "}
        <a
          href="https://nighwantech.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline hover:text-primary/90 transition-colors"
        >
          Nighwan Technology Pvt. Ltd.
        </a>
      </p>
      <a
        href="https://nighwantech.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-mono text-muted-foreground hover:text-primary hover:underline transition-colors"
      >
        nighwantech.com
      </a>
    </div>
  );
}
