import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  full?: boolean;
};

export function Button({
  children,
  variant = "primary",
  full = false,
  className,
  ...props
}: Props) {
  return (
    <button className={clsx("button", variant, full && "full", className)} {...props}>
      {children}
    </button>
  );
}
