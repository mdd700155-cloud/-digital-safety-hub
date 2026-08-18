import { Phone, ClipboardList, Lock, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Phone,
    title: "Stop the payments",
    desc: "Contact your bank immediately to block cards and UPI. If it's financial fraud, call 1930 right away.",
  },
  {
    icon: ClipboardList,
    title: "Save your evidence",
    desc: "Screenshot messages and transactions, note transaction IDs (UTR numbers), and don't delete anything.",
  },
  {
    icon: Lock,
    title: "Secure your accounts",
    desc: "Change your passwords, log out of other devices, and enable two-factor authentication where possible.",
  },
  {
    icon: ShieldAlert,
    title: "Report the incident",
    desc: "File a complaint on cybercrime.gov.in or visit your nearest cyber cell with your saved evidence.",
  },
];

export function FirstSteps() {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center">
        <ShieldAlert className="h-6 w-6 mr-2 text-primary" />
        Act fast — your first steps
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((step, idx) => (
          <Card
            key={step.title}
            className="border border-border/60 shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/10">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
                    {idx + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
