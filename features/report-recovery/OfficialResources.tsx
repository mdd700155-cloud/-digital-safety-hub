"use client";

import { ExternalLink, Phone, Globe, Search, ShieldAlert, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OfficialResources() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Evidence reminder */}
      <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg text-amber-800 dark:text-amber-400">
            <ClipboardList className="h-5 w-5 mr-2" />
            Preserve Your Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-900 dark:text-amber-300 mb-3">
            Before reporting, preserve all evidence. <strong>Do not delete suspicious messages.</strong>
          </p>
          <ul className="grid grid-cols-2 gap-1.5 text-sm text-amber-800 dark:text-amber-300">
            {[
              "Screenshots of messages/calls",
              "Transaction ID / UTR number",
              "Date & time of incident",
              "Suspect phone/email/URL",
              "Bank transaction details",
              "Call recordings (if any)",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Official Reporting Resources */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
          Official Reporting & Support
        </h3>

        <div className="space-y-3">
          {/* 1930 Helpline */}
          <Card className="border hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="font-semibold text-red-600 dark:text-red-400">Financial Cyber Fraud Helpline</p>
                  </div>
                  <p className="text-2xl font-bold tracking-widest mb-2">1930</p>
                  <p className="text-sm text-muted-foreground">
                    For immediate financial cyber fraud — call <strong>1930</strong> as soon as possible to freeze fraudulent transactions. Also report on the portal below.
                  </p>
                </div>
                <a
                  href="tel:1930"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call 1930
                </a>
              </div>
            </CardContent>
          </Card>

          {/* NCRP */}
          <Card className="border hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <p className="font-semibold">National Cyber Crime Reporting Portal</p>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-2">cybercrime.gov.in</p>
                  <p className="text-sm text-muted-foreground">
                    Official Government of India portal for filing cybercrime complaints. Report financial fraud, online scams, and social media abuse.
                  </p>
                </div>
                <a
                  href="https://cybercrime.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
                >
                  Report Online
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Report Suspect */}
          <Card className="border hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <p className="font-semibold">Report a Suspect Identifier</p>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-2">cybercrime.gov.in</p>
                  <p className="text-sm text-muted-foreground">
                    Use the official NCRP facility to report suspicious identifiers — website URLs, phone numbers, email IDs, WhatsApp/Telegram accounts, or social media profiles.
                  </p>
                </div>
                <a
                  href="https://cybercrime.gov.in/Webform/citi_reportSuspact.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
                >
                  Report Suspect
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Suspect Repository */}
          <Card className="border hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Search className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <p className="font-semibold">Check the Suspect Repository</p>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-2">cybercrime.gov.in</p>
                  <p className="text-sm text-muted-foreground">
                    Official government repository to check whether a phone number, email ID, bank account number, or URL has been flagged in cybercrime reports. This is a government database — not a universal website safety checker.
                  </p>
                </div>
                <a
                  href="https://cybercrime.gov.in/Webform/citi_reportSuspact.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
                >
                  Check Repository
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          These links open official government websites (cybercrime.gov.in). Digital Safety Hub does not submit your data to these sites.
        </p>
      </div>
    </div>
  );
}
