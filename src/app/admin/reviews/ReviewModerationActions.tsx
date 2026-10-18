"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function ReviewModerationActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function moderate(action: "approve" | "reject") {
    setLoading(true);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button size="sm" onClick={() => moderate("approve")} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white gap-1">
        <CheckCircle className="h-3 w-3" /> Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={() => moderate("reject")} disabled={loading}>
        <XCircle className="h-3 w-3" />
      </Button>
    </div>
  );
}
