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
        <div className="flex min-h-16 items-center justify-between gap-3 py-3">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="h-4 w-4" />
            </span>

            <span className="text-base sm:text-lg font-bold tracking-tight hidden sm:inline-block">
              Digital Safety Hub
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex items-center justify-end gap-0.5 whitespace-nowrap text-[11px] sm:text-sm font-medium text-muted-foreground"
          >
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-md px-1.5 py-2 transition-colors hover:text-foreground sm:px-3",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  {link.label === "Report & Recover" ? (
                    <>
                      <span className="sm:hidden">Report</span>
                      <span className="hidden sm:inline">{link.label}</span>
                    </>
                  ) : (
                    link.label
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </PageContainer>
    </header>
  );
}