"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "./PageContainer";

const navLinks = [
  { href: "/check", label: "Scam Check" },
  { href: "/report", label: "Report & Recover" },
  { href: "/learn", label: "Safety Hub" },
  { href: "/scamwatch", label: "ScamWatch" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <PageContainer>
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>

            <span className="text-base sm:text-lg font-bold tracking-tight hidden sm:inline-block">
              Digital Safety Hub
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-1.5 py-1.5 transition-colors hover:text-foreground sm:px-3",
                    isActive && "bg-primary/10 text-primary shadow-sm"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </PageContainer>
    </header>
  );
}