import { PageContainer } from "@/components/layout/PageContainer";

export default function CheckPage() {
  return (
    <PageContainer className="py-24">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Scam Check</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Check suspicious links, messages, screenshots, and QR codes.
        </p>
        <div className="mt-8 p-8 border border-dashed rounded-lg bg-muted/50 text-muted-foreground">
          Coming soon.
        </div>
      </div>
    </PageContainer>
  );
}
