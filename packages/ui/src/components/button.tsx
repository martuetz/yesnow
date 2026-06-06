import * as React from "react";
import { cn } from "../utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  hideArrow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", hideArrow = false, children, ...props }, ref) => {
    const showArrow = (variant === "primary" || variant === "secondary" || variant === "dark") && !hideArrow;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-display font-semibold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-full gap-2",
          // Variants
          variant === "primary" && "bg-primary text-white hover:bg-near-black",
          variant === "secondary" && "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white",
          variant === "dark" && "bg-near-black text-white hover:bg-primary",
          variant === "outline" && "border border-secondary bg-transparent hover:bg-light-grey text-near-black",
          variant === "ghost" && "bg-transparent hover:bg-light-grey text-near-black",
          // Sizes
          size === "sm" && "px-4 py-2 text-xs",
          size === "md" && "px-6 py-3.5 text-sm",
          size === "lg" && "px-8 py-4.5 text-base",
          className
        )}
        {...props}
      >
        {children}
        {showArrow && <span className="ml-1 text-current select-none">→</span>}
      </button>
    );
  }
);
Button.displayName = "Button";
