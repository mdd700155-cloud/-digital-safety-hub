import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldCheck, Search, Shield, RefreshCw, ArrowRight, MessageSquareWarning } from "lucide-react";
import { ScamChecker } from "@/features/scam-check/ScamChecker";

const steps = [
  {
    icon: Search,
    title: "Check",
    desc: "Submit suspicious messages, links, or images through our simple interface.",
  },
  {
    icon: ShieldCheck,
    title: "Understand",
    desc: "Get a clear, jargon-free explanation of the risk level.",
  },
  {
    icon: Shield,
    title: "Protect",
    desc: "Learn how to secure your accounts and personal information immediately.",
  },
  {
    icon: RefreshCw,
    title: "Recover",
    desc: "Follow step-by-step guidance if your information was compromised.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/60 via-muted/30 to-background py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_60%)] opacity-[0.04]" />
        <PageContainer className="relative flex flex-col items-center">
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 shadow-sm">
              <ShieldCheck className="mr-2 h-4 w-4" /> Your Digital Safety Companion
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto mb-6 leading-[1.1]">
              Not sure if it&apos;s a scam? <br className="hidden sm:block" /> Check it before you act.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Instantly check suspicious messages, links, screenshots, and QR codes. Understand potential risks and receive actionable guidance.
            </p>
          </div>

          <div className="w-full max-w-3xl mb-12">
            <ScamChecker compact />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-muted-foreground font-medium">Already been scammed?</span>
            <Link
              href="/report"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-6")}
            >
              Get immediate guidance
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </PageContainer>
      </section>

      {/* Trust/Value Section */}
      <section className="py-20 border-b border-border/40">
        <PageContainer>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How Digital Safety Hub works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We&apos;ve simplified digital threat analysis so anyone can protect themselves — no technical expertise needed.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center text-center rounded-xl border border-border/60 bg-card p-6 pt-8 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5 ring-1 ring-primary/10">
                  <step.icon className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Educational Preview */}
      <section className="py-20">
        <PageContainer>
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-muted/60 to-background p-10 md:p-16 text-center shadow-soft">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_55%)] opacity-[0.05]" />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-6 ring-1 ring-primary/10">
                <MessageSquareWarning className="h-6 w-6" />
              </span>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Empower Yourself</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Scammers use psychological tricks like urgency and fear. Explore our Safety Hub for quick guides on spotting common threats.
              </p>
              <Link
                href="/learn"
                className={cn(buttonVariants({ size: "lg" }), "px-8")}
              >
                Explore the Safety Hub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
