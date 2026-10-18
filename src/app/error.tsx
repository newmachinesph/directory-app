"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-24 text-center max-w-md">
      <h2 className="text-2xl font-serif font-bold mb-3">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        An unexpected error occurred. Please try again or contact support if the issue persists.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
