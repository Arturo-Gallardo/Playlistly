import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

type KbdProps = ComponentProps<"kbd">;

export function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center rounded border border-white/20 bg-white/[0.04] px-1.5 font-control text-[10px] font-semibold uppercase tracking-[0.08em] text-white/75",
        className,
      )}
      {...props}
    />
  );
}
