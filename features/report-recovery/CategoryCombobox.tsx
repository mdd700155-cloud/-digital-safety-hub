"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronRight, X, SearchX } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CategoryOption {
  id: string;
  category: string;
}

interface CategoryComboboxProps {
  options: CategoryOption[];
  onSelect: (id: string, categoryName: string) => void;
}

export function CategoryCombobox({ options, onSelect }: CategoryComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) =>
      opt.category.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string, categoryName: string) => {
    onSelect(id, categoryName);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        filtered.length === 0 ? prev : (prev + 1) % filtered.length
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        filtered.length === 0 ? prev : (prev - 1 + filtered.length) % filtered.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlightIndex];
      if (item) handleSelect(item.id, item.category);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor="category-search">Search incident type</Label>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="category-search"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="category-listbox"
          aria-activedescendant={
            open && filtered[highlightIndex]
              ? `category-option-${filtered[highlightIndex].id}`
              : undefined
          }
          placeholder="Search or pick an incident type…"
          className="flex h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              setQuery("");
              setHighlightIndex(0);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          id="category-listbox"
          role="listbox"
          aria-label="Incident categories"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lift animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <SearchX className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No matching categories</p>
              <p className="text-xs text-muted-foreground">
                Try a different keyword, e.g. &quot;UPI&quot;, &quot;loan&quot;, or &quot;social media&quot;.
              </p>
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto p-1.5">
              {filtered.map((opt, idx) => (
                <li
                  key={opt.id}
                  id={`category-option-${opt.id}`}
                  role="option"
                  aria-selected={idx === highlightIndex}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => handleSelect(opt.id, opt.category)}
                  className={cn(
                    "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                    idx === highlightIndex
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/90 hover:bg-muted"
                  )}
                >
                  <span className="font-medium">{opt.category}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-all",
                      idx === highlightIndex
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}