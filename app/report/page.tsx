import { RecoveryWizard } from "@/features/report-recovery/RecoveryWizard";
import { OfficialResources } from "@/features/report-recovery/OfficialResources";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { LifeBuoy, ShieldAlert } from "lucide-react";

export default function ReportPage() {
  return (
    <PageContainer className="py-12 md:py-20">
      <PageHeader
        align="left"
        badge="Act quickly"
        icon={<LifeBuoy className="h-4 w-4" />}
        title="Report & Recover"
        description="If you suspect you've been targeted, act quickly. Follow our guided checklist to mitigate damage and prepare your report."
      />
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-12">
        <div className="min-w-0">
          <RecoveryWizard />
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h3 className="text-lg font-semibold mb-4 flex items-center lg:mt-2">
            <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
            Official Support
          </h3>
          <OfficialResources compact />
        </aside>
      </div>
    </PageContainer>
  );
}