import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]",
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 border-b border-[var(--color-border)]", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold tracking-tight text-[var(--color-foreground)]", className)}
      {...rest}
    />
  );
}

export function CardSubtitle({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-[var(--color-muted)] mt-0.5", className)} {...rest} />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...rest} />;
}
