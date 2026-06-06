import { Card as RadixCard } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "surface" | "classic" | "translucent";
  size?: "1" | "2" | "3";
  className?: string;
}

export function Card({
  children,
  variant = "surface",
  size = "2",
  className,
}: CardProps) {
  return (
    <RadixCard variant={variant} size={size} className={className}>
      {children}
    </RadixCard>
  );
}
