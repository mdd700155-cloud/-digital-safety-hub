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

  const activeChecklist = recoveryChecklists.find(c => c.id === selectedCategory);

  const handleCategorySelect = (id: string, categoryName: string) => {
    setSelectedCategory(id);
    setFormData(prev => ({ ...prev, category: categoryName }));
    setStep(2);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const generateReportText = () => {
    return `INCIDENT REPORT SUMMARY (Locally Generated)
Date of Generation: ${new Date().toLocaleDateString()}

CATEGORY: ${formData.category}
INCIDENT DATE: ${formData.date || "Not provided"}
PLATFORM/WEBSITE: ${formData.platform || "Not provided"}
FINANCIAL LOSS: ${formData.amount || "None/Not provided"}

DESCRIPTION:
${formData.description || "No description provided."}

RECOMMENDED ACTION STEPS (From Digital Safety Hub):
${activeChecklist?.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") || "No steps available."}

--
Note: This report is generated locally on your device to help you organize your thoughts before speaking to authorities or your bank. It has NOT been submitted to any agency.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <CardTitle>Your Incident Summary is Ready</CardTitle>
            <CardDescription>Copy this information to use when filing an official report or contacting support.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md relative group font-mono text-sm whitespace-pre-wrap">
              {generateReportText()}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-6 bg-muted/10">
            <Button variant="outline" onClick={() => setStep(2)}>
              Edit Details
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleCopy} className="w-full sm:w-auto">
                <ClipboardCopy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy Report"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
