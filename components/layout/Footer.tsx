import Link from "next/link";
import { ShieldCheck, Phone, Globe } from "lucide-react";
import { PageContainer } from "./PageContainer";

const exploreLinks = [
  { href: "/check", label: "Scam Check" },
  { href: "/scamwatch", label: "ScamWatch" },
  { href: "/report", label: "Report & Recover" },
  { href: "/learn", label: "Safety Hub" },
];

const resourceLinks = [
  { href: "tel:1930", label: "1930 — Cyber Fraud Helpline", icon: Phone },
  { href: "https://cybercrime.gov.in/", label: "cybercrime.gov.in", icon: Globe, external: true },
];

export function Footer() {
  return (
    <footer className="relative z-0 w-full border-t border-border/40 bg-card/55 backdrop-blur-md">
      <PageContainer>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="text-base font-bold tracking-tight">Digital Safety Hub</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A free tool that helps everyday users check suspicious messages, links, screenshots, and QR codes before acting.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Explore</h3>
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Official Resources</h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <link.icon className="h-4 w-4 text-primary/70" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 py-4">
          <p className="text-center text-xs text-muted-foreground">
            Automated analysis is for guidance only — always use your best judgment.
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
