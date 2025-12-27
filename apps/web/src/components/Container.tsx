import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={"mx-auto w-full max-w-6xl px-6 " + (className ?? "")}>
      {children}
    </div>
  );
}
