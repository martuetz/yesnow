import * as React from "react";
import { cn } from "../utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-white rounded-xl shadow-sm border border-gray-200 p-6", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";
