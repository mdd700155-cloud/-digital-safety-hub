"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { recoveryChecklists } from "@/lib/mock/recoveryData";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ClipboardCopy, CheckCircle2, ShieldAlert } from "lucide-react";

interface IncidentData {
  category: string;
  date: string;
  amount: string;
  platform: string;
  description: string;
}

interface IncidentSummary extends IncidentData {
  steps: string[];
  generatedAt: string;
}

export function RecoveryWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [formData, setFormData] = useState<IncidentData>({
    category: "",
    date: "",
    amount: "",
    platform: "",
    description: "",
  });
  const [copied, setCopied] = useState(false);
  const [incidentSummary, setIncidentSummary] = useState<IncidentSummary | null>(null);

  const activeChecklist = recoveryChecklists.find(c => c.id === selectedCategory);

  const handleCategorySelect = (id: string, categoryName: string) => {
    setSelectedCategory(id);
    setFormData(prev => ({ ...prev, category: categoryName }));
    setStep(2);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const summary = {
      category: formData.category,
      date: formData.date,
      amount: formData.amount,
      platform: formData.platform,
      description: formData.description,
      steps: activeChecklist?.steps || [],
      generatedAt: new Date().toISOString(),
    };
    setIncidentSummary(summary);
    setStep(3);
  };

  const generateReportText = (source: IncidentSummary | null = incidentSummary) => {
    if (!source) return '';
    return `INCIDENT REPORT SUMMARY (Locally Generated)\nDate of Generation: ${new Date(source.generatedAt).toLocaleString()}\n\nCATEGORY: ${source.category}\nINCIDENT DATE: ${source.date || "Not provided"}\nPLATFORM/WEBSITE: ${source.platform || "Not provided"}\nFINANCIAL LOSS: ${source.amount || "None/Not provided"}\n\nDESCRIPTION:\n${source.description || "No description provided."}\n\nRECOMMENDED ACTION STEPS (From Digital Safety Hub):\n${(source.steps || []).map((s, i) => `${i + 1}. ${s}`).join("\n") || "No steps available."}\n\n--\nNote: This report is generated locally on your device to help you organize your thoughts before speaking to authorities or your bank. It has NOT been submitted to any agency.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!incidentSummary) return;
    const text = generateReportText();
    import('@/lib/helpers/evidenceExport').then(({ downloadTextFile }) => {
      downloadTextFile(`incident-summary-${new Date().toISOString()}.txt`, text);
    });
  };

  const handleDownloadJson = () => {
    if (!incidentSummary) return;
    import('@/lib/helpers/evidenceExport').then(({ downloadJsonFile }) => {
      downloadJsonFile(`incident-summary-${new Date().toISOString()}.json`, incidentSummary);
    });
  };

  const handleDownloadPng = async () => {
    if (!incidentSummary) return;
    const text = generateReportText();
    const { renderSummaryAsPng, downloadBlob } = await import('@/lib/helpers/evidenceExport');
    const dataUrl = await renderSummaryAsPng(text, { width: 900 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(`incident-summary-${new Date().toISOString()}.png`, blob);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 px-2 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300" style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }} />
        
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex flex-col items-center bg-background px-2 ${step >= s ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= s ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background"}`}>
              {s}
            </div>
            <span className="text-xs font-medium mt-2 hidden sm:block">
              {s === 1 ? "Select Type" : s === 2 ? "Checklist & Form" : "Summary"}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ShieldAlert className="h-6 w-6 mr-2 text-primary" />
              What kind of incident occurred?
            </CardTitle>
            <CardDescription>Select the category that best matches your situation to get tailored recovery steps.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {recoveryChecklists.map((item) => (
              <button
                key={item.id}
                onClick={() => handleCategorySelect(item.id, item.category)}
                className="flex items-center justify-between p-4 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span className="font-medium">{item.category}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl">Immediate Action Steps</CardTitle>
              <CardDescription>Follow these steps immediately to mitigate further damage.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-4">
                {activeChecklist?.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground/90">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <form onSubmit={handleFormSubmit}>
              <CardHeader>
                <CardTitle>Prepare an Incident Summary (Optional)</CardTitle>
                <CardDescription>
                  Fill out what you can. This will organize the details locally on your device so you can easily copy and paste them when reporting to your bank or authorities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date of Incident</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount Lost (if any)</Label>
                    <Input 
                      id="amount" 
                      placeholder="e.g. ₹5000" 
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform / Phone Number / URL involved</Label>
                  <Input 
                    id="platform" 
                    placeholder="Where did this happen?" 
                    value={formData.platform}
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Brief Description</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="What happened? Keep it brief and factual." 
                    className="resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="p-3 bg-muted/50 rounded text-xs text-muted-foreground border">
                  <strong>Privacy Note:</strong> This information never leaves your device. It is used solely to generate a text summary for you to copy.
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit">Generate Summary</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <CardTitle>Summary Ready</CardTitle>
            <CardDescription>Evidence summary generated locally. Download or copy before reporting.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{incidentSummary?.category}</p>
                <p className="text-sm text-muted-foreground">{incidentSummary?.date || 'Incident date not provided'}</p>
                <p className="text-xs mt-2">{incidentSummary?.platform || 'Platform / identifier not provided'}</p>
              </div>
              <div className="text-sm text-muted-foreground">Generated: {incidentSummary ? new Date(incidentSummary.generatedAt).toLocaleString() : ''}</div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-6 bg-muted/10">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Edit Details</Button>
              <Button onClick={handleCopy}>
                <ClipboardCopy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy Summary"}
              </Button>
              <Button onClick={handleDownloadTxt} variant="ghost">Download TXT</Button>
              <Button onClick={handleDownloadPng} variant="ghost">Download PNG</Button>
              <Button onClick={handleDownloadJson} variant="ghost">Download JSON</Button>
            </div>

            <div className="flex gap-2">
              <a href="tel:1930" className="inline-flex items-center justify-center rounded-md border px-3 py-2">Call 1930</a>
              <a href="https://cybercrime.gov.in/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border px-3 py-2">Report Online</a>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
