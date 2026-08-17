import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { MessageSquare, Link as LinkIcon, Image as ImageIcon, QrCode, ShieldCheck, Search, Shield, RefreshCw } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="bg-muted/30 py-20 md:py-32 border-b border-border/40">
        <PageContainer className="text-center flex flex-col items-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
            <ShieldCheck className="mr-2 h-4 w-4" /> Your Digital Safety Companion
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mb-6">
            Stay safe in a digital world with confidence.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Instantly check suspicious messages, links, screenshots, and QR codes. Understand potential risks and receive actionable guidance on what to do next.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/check" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Start Scam Check
            </Link>
            <Link 
              href="/report" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              I&apos;ve been scammed
            </Link>
          </div>
        </PageContainer>
      </section>

      {/* Quick Check Section */}
      <section className="py-20">
        <PageContainer>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">What can you check?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our tools are designed to analyze various types of digital content to identify potential threats.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MessageSquare, title: "Suspicious Messages", desc: "Analyze texts and emails for phishing attempts." },
              { icon: LinkIcon, title: "Sketchy Links", desc: "Scan URLs before you click them." },
              { icon: ImageIcon, title: "Screenshots", desc: "Upload images to detect fraudulent patterns." },
              { icon: QrCode, title: "QR Codes", desc: "Safely decode and verify QR code destinations." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Trust/Value Section */}
      <section className="py-20 bg-muted/30 border-y border-border/40">
        <PageContainer>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6">How Digital Safety Hub works</h2>
              <p className="text-lg text-muted-foreground mb-8">
                We&apos;ve simplified the process of digital threat analysis so anyone can protect themselves without needing technical expertise.
              </p>
              <div className="space-y-6">
                {[
                  { icon: Search, title: "1. Check", desc: "Submit the suspicious content through our simple interface." },
                  { icon: ShieldCheck, title: "2. Understand", desc: "Get a clear, jargon-free explanation of the risk level." },
                  { icon: Shield, title: "3. Protect", desc: "Learn how to secure your accounts and personal information." },
                  { icon: RefreshCw, title: "4. Recover", desc: "Follow step-by-step guidance if your information was compromised." },
                ].map((step, i) => (
                  <div key={i} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-foreground">
                        <step.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl border bg-background p-8 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-primary/5 to-transparent rounded-2xl"></div>
              <div className="relative space-y-6">
                <div className="p-4 border rounded-lg bg-card shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">High Risk Detected</p>
                      <p className="text-xs text-muted-foreground">Analysis Complete</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This message contains hallmarks of a standard phishing attempt. Do not click any links or provide personal information.
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-card shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Appears Safe</p>
                      <p className="text-xs text-muted-foreground">Analysis Complete</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We found no obvious threats in this URL. However, always remain vigilant when entering credentials online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Educational Preview */}
      <section className="py-20">
        <PageContainer className="text-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Empower Yourself</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our upcoming Safety Hub for comprehensive guides on digital hygiene.
            </p>
          </div>
          <Link 
            href="/learn" 
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Visit Safety Hub Preview
          </Link>
        </PageContainer>
      </section>
    </div>
  );
}
