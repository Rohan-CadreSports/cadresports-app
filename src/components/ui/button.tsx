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
      "inline-flex items-center justify-center font-semibold",
      "transition-all duration-200 ease-in-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:opacity-40 disabled:pointer-events-none",
    ].join(" ");

    const variants = {
      primary: "bg-brand text-white border-2 border-brand-dark rounded-[6px] shadow-[0_2px_4px_rgba(0,150,123,0.2)] hover:bg-brand-dark hover:shadow-[0_4px_8px_rgba(0,150,123,0.3)] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,150,123,0.2)]",
      secondary: "bg-accent text-accent-foreground border-2 border-accent rounded-[6px] hover:opacity-90",
      outline: "bg-transparent text-foreground border-2 border-foreground rounded-[6px] hover:bg-foreground hover:text-white",
      ghost: "text-brand bg-transparent rounded-[6px] underline underline-offset-4 decoration-1 hover:text-brand-dark",
      danger: "bg-red-600 text-white border-2 border-red-700 rounded-[6px] hover:bg-red-700",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm gap-1.5",
      md: "h-10 px-6 text-sm gap-2",
      lg: "h-11 px-8 text-base gap-2",
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
