import Link from "next/link";
import { Shield } from "lucide-react";
import { PageContainer } from "./PageContainer";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <PageContainer>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">
              Digital Safety Hub
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
            <Link href="/check" className="transition-colors hover:text-foreground">
              Scam Check
            </Link>
            <Link href="/report" className="transition-colors hover:text-foreground">
              Report & Recover
            </Link>
            <Link href="/learn" className="transition-colors hover:text-foreground">
              Safety Hub
            </Link>
          </nav>
        </div>
      </PageContainer>
    </header>
  );
}
