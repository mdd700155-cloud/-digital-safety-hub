import { ScamChecker } from "@/features/scam-check/ScamChecker";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScanSearch } from "lucide-react";

export default function CheckPage() {
  return (
    <PageContainer className="py-12 md:py-20 max-w-4xl">
      <PageHeader
        badge="Analyze before you act"
        icon={<ScanSearch className="h-4 w-4" />}
        title="Scam Check"
        description="Analyze suspicious content before you act. We check against known threat indicators to keep you safe."
      />
      <ScamChecker />
    </PageContainer>
  );
}
