import { PageContainer } from "./PageContainer";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 py-6 md:py-0">
      <PageContainer>
        <div className="flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for everyday digital safety.
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
