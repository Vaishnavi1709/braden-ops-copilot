import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[var(--color-accent)] to-[#1d8fc4] text-[var(--color-background)] hover:brightness-110 shadow-[0_0_0_1px_rgba(56,189,248,0.4),0_4px_16px_-4px_rgba(56,189,248,0.4)]",
  secondary:
    "bg-[var(--color-surface-2)] text-[var(--color-foreground)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]/80",
  ghost:
    "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight transition-all disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    />
  );
}
