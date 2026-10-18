"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  professionalId: string;
  applicationId: string;
}

export default function ApplicationActions({ professionalId, applicationId }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    setLoading(true);
    await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, applicationId, action, notes }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      {showReject && (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Rejection reason (optional)..."
          rows={2}
          className="text-sm"
        />
      )}
      <Button
        onClick={() => handleAction("approve")}
        disabled={loading}
        size="sm"
        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle className="h-4 w-4" /> Approve
      </Button>
      {!showReject ? (
        <Button variant="outline" size="sm" onClick={() => setShowReject(true)}>
          <XCircle className="h-4 w-4 mr-2" /> Reject
        </Button>
      ) : (
        <Button variant="destructive" size="sm" onClick={() => handleAction("reject")} disabled={loading}>
          Confirm Reject
        </Button>
      )}
    </div>
  );
}
