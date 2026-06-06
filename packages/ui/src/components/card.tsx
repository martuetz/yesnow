import * as React from "react";
import { cn } from "../utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "accent" | "on-cream";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg p-6 relative transition-all duration-200",
          variant === "default" && "bg-[#F8F9FE] border border-[#E8ECF5]",
          variant === "accent" && "bg-[#F8F9FE] border border-[#E8ECF5] border-l-4 border-l-primary",
          variant === "on-cream" && "bg-white border border-[#E0E0E0]",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
