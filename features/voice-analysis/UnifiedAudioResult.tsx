import { VoiceAnalysisResult, DeepfakeAnalysisResult } from "@/types/voiceAnalysis";
import { AudioPreviewData } from "@/features/voice-analysis/AudioPreview";
import { VoiceRiskResult } from "@/features/voice-analysis/VoiceRiskResult";
import { DeepfakeResult } from "@/features/deepfake-detection/DeepfakeResult";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, ShieldAlert, AudioWaveform } from "lucide-react";

interface UnifiedAudioResultProps {
  voiceResult: VoiceAnalysisResult;
  deepfakeResult: DeepfakeAnalysisResult;
  audio: AudioPreviewData;
  onReset: () => void;
}

export function UnifiedAudioResult({
  voiceResult,
  deepfakeResult,
  audio,
  onReset,
}: UnifiedAudioResultProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Audio Analysis Results</h2>
        <p className="text-muted-foreground text-sm">
          We scanned your audio for both malicious intent (scams, vishing) and synthetic generation (AI voice cloning, deepfakes).
        </p>
      </div>

      <Tabs defaultValue="intent" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1.5 sm:gap-2 p-1.5 sm:p-2 mb-6 shadow-sm">
          <TabsTrigger value="intent" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Scam & Intent</span>
            <span className="sm:hidden">Scam</span>
          </TabsTrigger>
          <TabsTrigger value="authenticity" className="flex items-center gap-2">
            <AudioWaveform className="h-4 w-4" />
            <span className="hidden sm:inline">Authenticity & Deepfake</span>
            <span className="sm:hidden">Deepfake</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intent" className="mt-0 animate-in fade-in slide-in-from-bottom-2">
          <VoiceRiskResult result={voiceResult} audio={audio} />
        </TabsContent>

        <TabsContent value="authenticity" className="mt-0 animate-in fade-in slide-in-from-bottom-2">
          <DeepfakeResult result={deepfakeResult} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-8 border-t">
        <Button type="button" variant="default" size="lg" onClick={onReset} className="w-full sm:w-auto">
          <RotateCcw className="mr-2 h-4 w-4" />
          Analyze Another Audio File
        </Button>
      </div>
    </div>
  );
}
