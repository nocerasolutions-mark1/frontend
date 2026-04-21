import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: Props) {
  return (
    <div className={clsx("card", className)} {...props}>
      {children}
    </div>
  );
}
