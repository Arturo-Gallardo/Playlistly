import { cn } from "../../lib/cn";

type CurvedHintArrowProps = {
  bend?: "left" | "center" | "right";
  className?: string;
};

// tip stays at the top center so it lines up with the measured anchor
export function CurvedHintArrow({
  bend = "center",
  className,
}: CurvedHintArrowProps) {
  const path =
    bend === "left"
      ? "M 32 58 C 26 42, 22 24, 20 8"
      : bend === "right"
        ? "M 8 58 C 14 42, 18 24, 20 8"
        : "M 20 58 C 12 42, 28 24, 20 8";

  return (
    <svg
      aria-hidden
      className={cn("h-16 w-10 shrink-0 text-white/35", className)}
      fill="none"
      viewBox="0 0 40 64"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path d="M 20 2 L 14.5 9.5 L 25.5 9.5 Z" fill="currentColor" />
    </svg>
  );
}
