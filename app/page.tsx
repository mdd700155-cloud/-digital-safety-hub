import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { ShieldCheck, Search, Shield, RefreshCw } from "lucide-react";
import { ScamChecker } from "@/features/scam-check/ScamChecker";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16 md:py-24 border-b border-border/40">
        <PageContainer className="flex flex-col items-center">
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
              <ShieldCheck className="mr-2 h-4 w-4" /> Your Digital Safety Companion
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto mb-6">
              Not sure if it&apos;s a scam? <br className="hidden sm:block"/> Check it before you act.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Instantly check suspicious messages, links, screenshots, and QR codes. Understand potential risks and receive actionable guidance.
            </p>
          </div>
          
          <div className="w-full max-w-3xl mb-12">
            <ScamChecker compact />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
            <span className="text-muted-foreground mr-2 font-medium">Already been scammed?</span>
            <Link 
              href="/report" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Get immediate guidance
            </Link>
          </div>
        </PageContainer>
      </section>

      {/* Trust/Value Section */}
      <section className="py-20 border-b border-border/40">
        <PageContainer>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How Digital Safety Hub works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve simplified the process of digital threat analysis so anyone can protect themselves without needing technical expertise.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Search, title: "1. Check", desc: "Submit suspicious messages, links, or images through our simple interface." },
              { icon: ShieldCheck, title: "2. Understand", desc: "Get a clear, jargon-free explanation of the risk level." },
              { icon: Shield, title: "3. Protect", desc: "Learn how to secure your accounts and personal information immediately." },
              { icon: RefreshCw, title: "4. Recover", desc: "Follow step-by-step guidance if your information was compromised." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col text-center items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <step.icon className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold mb-3">{step.title}</h4>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Educational Preview */}
      <section className="py-20 bg-muted/30">
        <PageContainer className="text-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Empower Yourself</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scammers use psychological tricks like urgency and fear. Explore our Safety Hub for quick guides on spotting common threats.
            </p>
          </div>
          <Link 
            href="/learn" 
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Explore the Safety Hub
          </Link>
        </PageContainer>
      </section>
    </div>
  );
}
