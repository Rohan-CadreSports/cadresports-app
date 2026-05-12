import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-500",
  success: "bg-emerald-50/80 text-emerald-600",
  warning: "bg-amber-50/80 text-amber-600",
  danger: "bg-red-50/80 text-red-500",
  info: "bg-sky-50/80 text-sky-600",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
