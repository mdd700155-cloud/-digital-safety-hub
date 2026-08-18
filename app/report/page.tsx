import { RecoveryWizard } from "@/features/report-recovery/RecoveryWizard";
import { OfficialResources } from "@/features/report-recovery/OfficialResources";
import { PageContainer } from "@/components/layout/PageContainer";

export default function ReportPage() {
  return (
    <PageContainer className="py-12 md:py-24">
      <div className="flex flex-col text-center space-y-4 mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Report & Recover</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          If you suspect you&apos;ve been targeted, act quickly. Follow our guided checklist to mitigate damage and prepare your report.
        </p>
      </div>

      <RecoveryWizard />
      <OfficialResources />
    </PageContainer>
  );
}
