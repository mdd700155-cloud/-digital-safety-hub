import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScanSearch, MessageSquare, Link as LinkIcon, ScanFace, Mail } from "lucide-react";
import { ScamChecker } from "@/features/scam-check/ScamChecker";

const checkTypes = [
  { icon: Mail, label: "Mail", desc: "Email headers & .eml forensics" },
  { icon: LinkIcon, label: "URL", desc: "Phishing links checked without visiting" },
  { icon: MessageSquare, label: "Message · QR · Screenshot", desc: "SMS/WhatsApp, QR codes & screenshots" },
  { icon: ScanFace, label: "Image & Voice", desc: "Face deepfake & voice cloning checks" },
];

export default function CheckPage() {
  return (
    <PageContainer className="py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PageHeader
            align="left"
            badge="Analyze before you act"
            icon={<ScanSearch className="h-4 w-4" />}
            title="Scam Check"
            description="Analyze suspicious content before you act. We check against known threat indicators to keep you safe."
            className="mb-8"
          />
          <div className="hidden lg:block rounded-xl border border-border/60 bg-muted/30 p-6">
            <h2 className="text-sm font-semibold mb-4">What can you check?</h2>
            <ul className="space-y-4">
              {checkTypes.map((type) => (
                <li key={type.label} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/10">
                    <type.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
              We never visit the websites we analyze — and nothing you paste is stored.
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <ScamChecker />
        </div>
      </div>
    </PageContainer>
  );
}