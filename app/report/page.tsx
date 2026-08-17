import { PageContainer } from "@/components/layout/PageContainer";

export default function ReportPage() {
  return (
    <PageContainer className="py-24">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Report & Recover</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Get actionable steps if you&apos;ve been targeted by a scam.
        </p>
        <div className="mt-8 p-8 border border-dashed rounded-lg bg-muted/50 text-muted-foreground">
          Coming soon.
        </div>
      </div>
    </PageContainer>
  );
}
