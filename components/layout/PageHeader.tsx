import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  icon?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  icon,
  align = "center",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-4 mb-12",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {(badge || icon) && (
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary shadow-sm">
          {icon}
          {badge}
        </span>
      )}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
      <p
        className={cn(
          "text-lg text-muted-foreground leading-relaxed",
          align === "center" ? "max-w-2xl mx-auto" : "max-w-xl"
        )}
      >
        {description}
      </p>
    </div>
  );
}
