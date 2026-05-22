"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = [
      "inline-flex items-center justify-center font-medium",
      "transition-all duration-200",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:opacity-40 disabled:pointer-events-none",
      "active:scale-[0.98]",
    ].join(" ");

    const variants = {
      primary: "bg-brand text-white hover:opacity-90 rounded-[8px]",
      secondary: "bg-accent text-accent-foreground hover:opacity-90 rounded-[8px]",
      outline: "border border-border text-foreground hover:bg-muted/80 rounded-[8px]",
      ghost: "text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-[8px]",
      danger: "bg-red-500 text-white hover:opacity-90 rounded-[8px]",
    };

    const sizes = {
      sm: "h-9 px-4 text-[13px] gap-1.5",
      md: "h-10 px-5 text-[14px] gap-2",
      lg: "h-11 px-7 text-[15px] gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
