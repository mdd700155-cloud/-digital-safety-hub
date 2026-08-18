"use client";

import { ExternalLink, Phone, Globe, Search, ShieldAlert, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const resources = [
  {
    icon: Phone,
    iconClass: "bg-red-100 text-red-600",
    title: "Financial Cyber Fraud Helpline",
    titleClass: "text-red-600",
    domain: null,
    highlight: "1930",
    description:
      "For immediate financial cyber fraud — call 1930 as soon as possible to freeze fraudulent transactions. Also report on the portal below.",
    href: "tel:1930",
    cta: "Call 1930",
    external: false,
  },
  {
    icon: Globe,
    iconClass: "bg-blue-100 text-blue-600",
    title: "National Cyber Crime Reporting Portal",
    titleClass: null,
    domain: "cybercrime.gov.in",
    description:
      "Official Government of India portal for filing cybercrime complaints. Report financial fraud, online scams, and social media abuse.",
    href: "https://cybercrime.gov.in/",
    cta: "Report Online",
    external: true,
  },
  {
    icon: ShieldAlert,
    iconClass: "bg-orange-100 text-orange-600",
    title: "Report a Suspect Identifier",
    titleClass: null,
    domain: "cybercrime.gov.in",
    description:
      "Use the official NCRP facility to report suspicious identifiers — website URLs, phone numbers, email IDs, WhatsApp/Telegram accounts, or social media profiles.",
    href: "https://cybercrime.gov.in/Webform/citi_reportSuspact.aspx",
    cta: "Report Suspect",
    external: true,
  },
  {
    icon: Search,
    iconClass: "bg-purple-100 text-purple-600",
    title: "Check the Suspect Repository",
    titleClass: null,
    domain: "cybercrime.gov.in",
    description:
      "Official government repository to check whether a phone number, email ID, bank account number, or URL has been flagged in cybercrime reports. This is a government database — not a universal website safety checker.",
    href: "https://cybercrime.gov.in/Webform/citi_reportSuspact.aspx",
    cta: "Check Repository",
    external: true,
  },
];

interface OfficialResourcesProps {
  compact?: boolean;
}

export function OfficialResources({ compact = false }: OfficialResourcesProps) {
  return (
    <div
      className={cn(
        "w-full max-w-3xl mx-auto mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
        compact && "max-w-none mx-0 mt-0"
      )}
    >
      {/* Evidence reminder */}
      <Card className="border-warning/30 bg-warning/5 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg text-warning-foreground">
            <ClipboardList className="h-5 w-5 mr-2" />
            Preserve Your Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-warning-foreground mb-3 leading-relaxed">
            Before reporting, preserve all evidence. <strong>Do not delete suspicious messages.</strong>
          </p>
          <ul className={cn("grid gap-1.5 text-sm text-warning-foreground", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
            {[
              "Screenshots of messages/calls",
              "Transaction ID / UTR number",
              "Date & time of incident",
              "Suspect phone/email/URL",
              "Bank transaction details",
              "Call recordings (if any)",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Official Reporting Resources */}
      <div>
        {!compact && (
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
            Official Reporting & Support
          </h3>
        )}

        <div className="space-y-3">
          {resources.map((res) => (
            <Card key={res.title} className="border hover:border-primary/50 hover:shadow-soft transition-all">
              <CardContent className={compact ? "p-4" : "p-5"}>
                <div className={cn("flex items-start justify-between gap-4", compact && "flex-col")}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", res.iconClass)}>
                        <res.icon className="h-4 w-4" />
                      </span>
                      <p className={cn("font-semibold", res.titleClass)}>{res.title}</p>
                    </div>
                    {res.domain && (
                      <p className="text-xs font-mono text-muted-foreground mb-2">{res.domain}</p>
                    )}
                    {res.highlight && (
                      <p className="text-3xl font-bold tracking-widest mb-2">{res.highlight}</p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                  <a
                    href={res.href}
                    {...(res.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "whitespace-nowrap shrink-0",
                      compact && "w-full"
                    )}
                  >
                    {res.cta}
                    {res.external && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          These links open official government websites (cybercrime.gov.in). Digital Safety Hub does not submit your data to these sites.
        </p>
      </div>
    </div>
  );
}