import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageContainer } from "./PageContainer";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-muted/20">
      <PageContainer>
        <div className="flex flex-col items-center justify-between gap-6 py-8 md:flex-row md:py-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Digital Safety Hub</span>
              <span className="text-xs text-muted-foreground">
                Built for everyday digital safety.
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
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
        <div className="border-t border-border/40 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Automated analysis is for guidance only — always use your best judgment.
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
