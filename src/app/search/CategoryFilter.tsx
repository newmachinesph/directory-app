"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  selectedCategory: string;
  searchParams: Record<string, string>;
}

export default function CategoryFilter({ categories, selectedCategory, searchParams }: CategoryFilterProps) {
  function buildUrl(catSlug: string) {
    const ps = new URLSearchParams(searchParams);
    if (catSlug) ps.set("category", catSlug);
    else ps.delete("category");
    ps.delete("page");
    return `/search?${ps.toString()}`;
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-sm mb-3">Category</h3>
      <ul className="space-y-1">
        <li>
          <Link
            href={buildUrl("")}
            className={cn(
              "block px-3 py-1.5 rounded text-sm transition-colors",
              !selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            All Categories
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={buildUrl(cat.slug)}
              className={cn(
                "block px-3 py-1.5 rounded text-sm transition-colors",
                selectedCategory === cat.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
