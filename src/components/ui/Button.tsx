import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
  primary:
    "border border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:opacity-90",
  ghost: "border border-transparent hover:bg-[var(--color-surface)]",
};

export function Button({
  variant = "default",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    />
  );
}
