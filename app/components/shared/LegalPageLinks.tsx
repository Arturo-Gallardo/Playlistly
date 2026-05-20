import Link from "next/link";
import { cn } from "../../lib/cn";

type LegalPageLinksProps = {
  className?: string;
  onNavigate?: () => void;
};

export function LegalPageLinks({ className, onNavigate }: LegalPageLinksProps) {
  const linkClassName =
    "text-[10px] text-white/45 underline decoration-white/20 underline-offset-2 transition hover:text-[#CA3E47] hover:decoration-[#CA3E47]/50";

  return (
    <nav
      aria-label="Legal"
      className={cn("flex items-center gap-3", className)}
    >
      <Link className={linkClassName} href="/privacy" onClick={onNavigate}>
        Privacy
      </Link>
      <span aria-hidden="true" className="text-[10px] text-white/25">
        ·
      </span>
      <Link className={linkClassName} href="/terms" onClick={onNavigate}>
        Terms
      </Link>
    </nav>
  );
}
