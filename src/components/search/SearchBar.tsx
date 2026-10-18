"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  defaultQuery?: string;
  defaultLocation?: string;
  defaultRadius?: number;
  className?: string;
  size?: "default" | "large";
}

export default function SearchBar({
  defaultQuery = "",
  defaultLocation = "",
  defaultRadius = 50,
  className = "",
  size = "default",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [location, setLocation] = useState(defaultLocation);
  const [radius, setRadius] = useState(defaultRadius);
  const [geocoding, setGeocoding] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());

    if (location.trim()) {
      setGeocoding(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(location.trim())}`);
        if (res.ok) {
          const data = await res.json();
          params.set("lat", data.lat.toString());
          params.set("lng", data.lng.toString());
          params.set("location", location.trim());
          params.set("radius", radius.toString());
        }
      } catch {
        // proceed without geocoding
      } finally {
        setGeocoding(false);
      }
    }

    router.push(`/search?${params.toString()}`);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
    });
  }

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, specialty..."
          className={`pl-9 ${isLarge ? "h-12 text-base" : ""}`}
        />
      </div>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, ZIP, or 'near me'"
          className={`pl-9 pr-20 ${isLarge ? "h-12 text-base" : ""}`}
        />
        <button
          type="button"
          onClick={useMyLocation}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
        >
          Near me
        </button>
      </div>
      <select
        value={radius}
        onChange={(e) => setRadius(parseInt(e.target.value))}
        className={`border border-input rounded-md px-3 bg-background text-sm ${isLarge ? "h-12" : "h-10"}`}
      >
        <option value={10}>10 mi</option>
        <option value={25}>25 mi</option>
        <option value={50}>50 mi</option>
        <option value={100}>100 mi</option>
        <option value={200}>200 mi</option>
      </select>
      <Button type="submit" disabled={geocoding} className={isLarge ? "h-12 px-8" : ""}>
        {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
    </form>
  );
}
