import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldCheck, Search, Shield, RefreshCw, ArrowRight, MessageSquareWarning, Lock, Smartphone, Zap, BookOpen } from "lucide-react";
import { ScamChecker } from "@/features/scam-check/ScamChecker";

const steps = [
  {
    icon: Search,
    title: "Check",
    desc: "Submit suspicious messages, links, screenshots, or QR codes through our simple interface.",
  },
  {
    icon: ShieldCheck,
    title: "Understand",
    desc: "Get a clear, jargon-free explanation of the risk level and why it was flagged.",
  },
  {
    icon: Shield,
    title: "Protect",
    desc: "Learn how to secure your accounts and personal information immediately.",
  },
  {
    icon: RefreshCw,
    title: "Recover",
    desc: "Follow step-by-step guidance if your information was already compromised.",
  },
];

const stats = [
  { value: "4", label: "Types of content you can check" },
  { value: "20", label: "Recovery guides for real scams" },
  { value: "3", label: "Easy-to-read safety guides" },
  { value: "1930", label: "Official cyber fraud helpline" },
];

const trustPoints = [
  { icon: Lock, label: "No login needed" },
  { icon: Zap, label: "Results in seconds" },
  { icon: Smartphone, label: "Works on any device" },
];

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section — split layout */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/60 via-muted/30 to-background py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_60%)] opacity-[0.04]" />
        <PageContainer className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 shadow-sm">
                <ShieldCheck className="mr-2 h-4 w-4" /> Your Digital Safety Companion
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
                Not sure if it&apos;s a scam?{" "}
                <span className="text-foreground">Check it before you act.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                Instantly check suspicious messages, links, screenshots, and QR codes. Understand potential risks and receive actionable guidance.
              </p>
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-8">
                <a
                  href="#scam-check"
                  className={cn(buttonVariants({ size: "lg" }), "px-8 w-full sm:w-auto")}
                >
                  Check it now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <Link
                  href="/report"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8 w-full sm:w-auto")}
                >
                  Already been scammed?
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2">
                {trustPoints.map((point) => (
                  <span key={point.label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <point.icon className="h-4 w-4 text-primary/70" />
                    {point.label}
                  </span>
                ))}
              </div>
            </div>

            <div id="scam-check" className="scroll-mt-24">
              <div className="rounded-2xl bg-muted/50 p-1 ring-1 ring-border/60">
                <div className="rounded-[15px] bg-background">
                  <ScamChecker compact />
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border/40 bg-background">
        <PageContainer>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/60">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-8 text-center">
                <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* How it works — bento grid */}
      <section className="py-20">
        <PageContainer>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-14">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight mb-3">How Digital Safety Hub works</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We&apos;ve simplified digital threat analysis so anyone can protect themselves — no technical expertise needed.
              </p>
            </div>
            <Link
              href="/check"
              className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
            >
              Open Scam Check
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.slice(0, 3).map((step, i) => (
              <div
                key={step.title}
                className="relative flex flex-col rounded-xl border border-border/60 bg-card p-7 shadow-soft transition-all hover:shadow-lift hover:border-primary/40"
              >
                <span className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                  {i + 1}
                </span>
                <div className="h-13 w-13 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5 ring-1 ring-primary/10">
                  <step.icon className="h-6.5 w-6.5" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}

            <div className="relative flex flex-col rounded-xl border border-border/60 bg-card p-7 shadow-soft transition-all hover:shadow-lift hover:border-primary/40 md:col-span-2 lg:col-span-2">
              <span className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                4
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="h-13 w-13 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/10">
                  <RefreshCw className="h-6.5 w-6.5" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">Recover</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Follow step-by-step guidance if your information was already compromised — including official helplines like 1930 and the national cybercrime portal.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl border border-primary/20 bg-muted/50 p-7 shadow-soft">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--primary)_0%,transparent_60%)] opacity-[0.04]" />
              <div className="relative">
                <div className="h-13 w-13 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-5 shadow-sm">
                  <BookOpen className="h-6.5 w-6.5" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Learn the patterns</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Short guides on phishing, UPI scams, and fake job offers — spot the red flags before scammers strike.
                </p>
              </div>
              <Link
                href="/learn"
                className={cn(buttonVariants({ size: "sm" }), "relative")}
              >
                Visit Safety Hub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Educational Preview */}
      <section className="py-20 border-t border-border/40 bg-muted/20">
        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-6 ring-1 ring-primary/10">
                <MessageSquareWarning className="h-6 w-6" />
              </span>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Empower Yourself</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Scammers use psychological tricks like urgency and fear. Explore our Safety Hub for quick guides on spotting common threats before they reach you.
              </p>
            </div>
            <div className="flex lg:justify-end">
              <Link
                href="/learn"
                className={cn(buttonVariants({ size: "lg" }), "px-8 w-full sm:w-auto")}
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