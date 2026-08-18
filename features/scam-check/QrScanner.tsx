"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, X, Loader2, ScanLine } from "lucide-react";

interface QrScannerProps {
  onDecoded: (text: string) => void;
  onError?: (err: string) => void;
}

export function QrScanner({ onDecoded, onError }: QrScannerProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
    if (mountedRef.current) {
      setIsStarted(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  const startScanner = async () => {
    setCameraError(null);
    setIsLoading(true);

    try {
      // Dynamically import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!mountedRef.current) return;
          setLastScanned(decodedText);
          stopScanner().then(() => {
            onDecoded(decodedText);
          });
        },
        () => {
          // QR not found yet — this is normal, ignore
        }
      );

      if (mountedRef.current) {
        setIsStarted(true);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Camera access denied or not available.";
      if (mountedRef.current) {
        setCameraError(
          message.includes("NotAllowedError") || message.includes("Permission")
            ? "Camera permission was denied. Please allow camera access in your browser settings and try again."
            : "Unable to start camera. Please ensure your device has a working camera."
        );
        setIsStarted(false);
        setIsLoading(false);
      }
      onError?.(message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera preview container — html5-qrcode mounts into this div */}
      {isStarted && (
        <div className="w-full relative">
          <div id="qr-reader" className="w-full overflow-hidden rounded-xl ring-1 ring-border" />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 z-10 shadow-sm"
            onClick={stopScanner}
          >
            <X className="h-4 w-4 mr-1" />
            Stop Camera
          </Button>
        </div>
      )}

      {!isStarted && (
        <>
          {/* Placeholder / launch button */}
          <div
            id="qr-reader"
            className="hidden"
            // Keep the element in DOM so html5-qrcode can always find it
          />

          {lastScanned && (
            <Badge variant="secondary" className="max-w-full truncate">
              Last scan: {lastScanned.slice(0, 60)}{lastScanned.length > 60 ? "…" : ""}
            </Badge>
          )}

          {cameraError ? (
            <div className="text-sm text-destructive text-center p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg w-full">
              {cameraError}
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-3 py-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/10">
              <ScanLine className="h-6 w-6" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={startScanner}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting camera…
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraError ? "Retry Camera" : "Start Camera Scanner"}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
            Point your camera at a QR code. It will be analyzed automatically without visiting the destination.
          </p>
        </>
      )}
    </div>
  );
}