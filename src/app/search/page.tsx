import { Suspense } from "react";
import SearchResults from "./SearchResults";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Search Professionals | BoudoirDirectory",
  description: "Search for boudoir photographers and professionals near you.",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={params} />
      </Suspense>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
