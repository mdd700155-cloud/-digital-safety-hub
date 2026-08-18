import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center text-center space-y-4 mb-12", className)}>
      {(badge || icon) && (
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {icon}
          {badge}
        </span>
      )}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
