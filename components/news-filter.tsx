"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { categories, countries, sectors } from "@/lib/utils";

export function NewsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [sector, setSector] = useState(searchParams.get("sector") || "");
  const [isOpen, setIsOpen] = useState(false);

  // Check if any filter is active
  const hasActiveFilters = category || country || sector;

  // Create URL with the current filters
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      
      return newParams.toString();
    },
    [searchParams]
  );

  // Apply filters
  const applyFilters = () => {
    const query = createQueryString({
      category,
      country,
      sector,
    });
    
    router.push(`${pathname}?${query}`);
    setIsOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setCategory("");
    setCountry("");
    setSector("");
    router.push(pathname);
    setIsOpen(false);
  };

  // Sync state with URL params on mount
  useEffect(() => {
    setCategory(searchParams.get("category") || "");
    setCountry(searchParams.get("country") || "");
    setSector(searchParams.get("sector") || "");
  }, [searchParams]);

  return (
    <div className="flex items-center gap-2">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="gap-1"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-medium text-primary">
                {[category, country, sector].filter(Boolean).length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter News</SheetTitle>
            <SheetDescription>
              Apply filters to find specific news content
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger id="sector">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sectors</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-between pt-4">
              <Button variant="outline" onClick={clearFilters} type="button">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button onClick={applyFilters} type="button">
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Show active filters as badges on desktop */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}