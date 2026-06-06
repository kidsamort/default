import { Button as RadixButton } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "solid" | "outline" | "soft" | "surface";
  color?:
    | "gray"
    | "gold"
    | "bronze"
    | "brown"
    | "yellow"
    | "amber"
    | "orange"
    | "pink"
    | "red"
    | "ruby"
    | "crimson"
    | "pink"
    | "purple"
    | "violet"
    | "iris"
    | "indigo"
    | "blue"
    | "cyan"
    | "teal"
    | "mint"
    | "green"
    | "lime"
    | "olive"
    | "sky"
    | "slate";
  size?: "1" | "2" | "3";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = "solid",
  color = "blue",
  size = "2",
  onClick,
  disabled,
  className,
}: ButtonProps) {
  return (
    <RadixButton
      variant={variant}
      color={color}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </RadixButton>
  );
}
