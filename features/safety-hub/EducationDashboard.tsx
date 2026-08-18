"use client";

import { useState } from "react";
import { safetyTopics, SafetyTopic } from "@/lib/mock/safetyData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Shield, ArrowLeft, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EducationDashboard() {
  const [selectedTopic, setSelectedTopic] = useState<SafetyTopic | null>(null);

  if (selectedTopic) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <Button variant="ghost" onClick={() => setSelectedTopic(null)} className="mb-2 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Topics
        </Button>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{selectedTopic.title}</h1>
            <p className="text-xl text-muted-foreground">{selectedTopic.description}</p>
          </div>

          <Card>
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center text-xl">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-foreground/90 leading-relaxed">
              {selectedTopic.howItWorks}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-red-200 dark:border-red-900/30">
              <CardHeader className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20">
                <CardTitle className="flex items-center text-red-700 dark:text-red-400 text-lg">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Warning Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {selectedTopic.warningSigns.map((sign, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-sm">{sign}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-900/30">
              <CardHeader className="bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/20">
                <CardTitle className="flex items-center text-green-700 dark:text-green-400 text-lg">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  What To Do
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {selectedTopic.whatToDo.map((action, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted border-none">
            <CardHeader>
              <CardTitle className="text-lg">Example Scenario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-background border rounded-md font-mono text-sm shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40" />
                {selectedTopic.example}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Learn About Scams</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Scammers constantly evolve their tactics. Read our quick guides to understand common threats and how to spot them.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {safetyTopics.map((topic) => (
          <Card 
            key={topic.id} 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group flex flex-col h-full"
            onClick={() => setSelectedTopic(topic)}
          >
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">{topic.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-2">{topic.description}</CardDescription>
            </CardHeader>
            <div className="flex-1" />
            <div className="p-6 pt-0 mt-4 flex items-center text-sm font-medium text-primary">
              Read more <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
