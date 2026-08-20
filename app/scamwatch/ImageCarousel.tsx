"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageCarouselProps = {
  images: string[];
  alt: string;
  className?: string;
};

export function ImageCarousel({
  images,
  alt,
  className,
}: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  const hasMultiple = images.length > 1;

  function go(direction: 1 | -1) {
    setIndex((current) =>
      (current + direction + images.length) % images.length
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden bg-muted",
        className
      )}
    >
      <img
        key={images[index]}
        src={images[index]}
        alt={`${alt} — image ${index + 1}`}
        className="h-full w-full object-cover"
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((image, i) => (
              <button
                key={image}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  i === index
                    ? "w-4 bg-background shadow-sm"
                    : "w-1.5 bg-background/50 hover:bg-background/80"
                )}
              />
            ))}
          </div>
        </>
      )}

      {hasMultiple && (
        <span className="absolute right-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur-sm">
          {index + 1}/{images.length}
        </span>
      )}
    </div>
  );
}