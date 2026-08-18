import { RecoveryWizard } from "@/features/report-recovery/RecoveryWizard";
import { OfficialResources } from "@/features/report-recovery/OfficialResources";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { LifeBuoy } from "lucide-react";

export default function ReportPage() {
  return (
    <PageContainer className="py-12 md:py-20">
      <PageHeader
        badge="Act quickly"
        icon={<LifeBuoy className="h-4 w-4" />}
        title="Report & Recover"
        description="If you suspect you've been targeted, act quickly. Follow our guided checklist to mitigate damage and prepare your report."
      />
      <RecoveryWizard />
      <OfficialResources />
    </PageContainer>
  );
}
