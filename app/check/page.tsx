import { ScamChecker } from "@/features/scam-check/ScamChecker";
import { PageContainer } from "@/components/layout/PageContainer";

export default function CheckPage() {
  return (
    <PageContainer className="py-12 md:py-24 max-w-4xl">
      <div className="flex flex-col text-center space-y-4 mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Scam Check</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Analyze suspicious content before you act. We check against known threat indicators to keep you safe.
        </p>
      </div>
      
      <ScamChecker />
    </PageContainer>
  );
}
