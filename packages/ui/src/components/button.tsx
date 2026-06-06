import * as React from "react";
import { cn } from "../utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-lg",
          // Variants
          variant === "primary" && "bg-primary text-white hover:bg-blue-700",
          variant === "secondary" && "bg-blue-50 text-blue-600 hover:bg-blue-100",
          variant === "outline" && "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
          variant === "ghost" && "bg-transparent hover:bg-gray-100 text-gray-700",
          // Sizes
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2.5 text-base",
          size === "lg" && "px-6 py-3.5 text-lg",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
