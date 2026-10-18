"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  professionalId: string;
  currentStatus: string;
  slug: string;
}

export default function ProfessionalAdminActions({ professionalId, currentStatus, slug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    setLoading(true);
    await fetch("/api/admin/professionals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link href={`/professionals/${slug}`} target="_blank">
        <Button variant="ghost" size="sm" className="text-xs">View ↗</Button>
      </Link>
      {currentStatus === "approved" ? (
        <Button variant="outline" size="sm" onClick={() => updateStatus("suspended")} disabled={loading} className="text-xs">Suspend</Button>
      ) : currentStatus === "suspended" ? (
        <Button variant="outline" size="sm" onClick={() => updateStatus("approved")} disabled={loading} className="text-xs">Reactivate</Button>
      ) : currentStatus === "pending" ? (
        <Button size="sm" onClick={() => updateStatus("approved")} disabled={loading} className="text-xs bg-green-600 hover:bg-green-700 text-white">Approve</Button>
      ) : null}
    </div>
  );
}
