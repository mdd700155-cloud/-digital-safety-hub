"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "./PageContainer";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileNav } from "./MobileNav";

const navLinks = [
  { href: "/check", label: "Scam Check" },
  { href: "/report", label: "Report & Recover" },
  { href: "/learn", label: "Safety Hub" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <PageContainer>
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <span className="text-base sm:text-lg font-bold tracking-tight">
                Digital Safety Hub
              </span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-6">
              <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium text-muted-foreground">
                {navLinks.map((link) => {
                  const isActive =
                    pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "rounded-md px-2 py-1.5 transition-colors hover:text-foreground sm:px-3",
                        isActive && "bg-primary/10 text-primary shadow-sm"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-1.5">
                <div className="h-5 w-px bg-border hidden sm:block" />
                <ThemeToggle />
                <button
                  type="button"
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </PageContainer>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
