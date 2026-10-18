"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BlogPostActions({ postId, published, slug }: { postId: string; published: boolean; slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function togglePublish() {
    setLoading(true);
    await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, action: published ? "unpublish" : "publish" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Link href={`/blog/${slug}`} target="_blank"><Button variant="ghost" size="sm" className="text-xs">View ↗</Button></Link>
      <Link href={`/admin/blog/${postId}`}><Button variant="outline" size="sm" className="text-xs">Edit</Button></Link>
      <Button variant={published ? "outline" : "default"} size="sm" onClick={togglePublish} disabled={loading} className="text-xs">
        {loading ? "..." : published ? "Unpublish" : "Publish"}
      </Button>
    </div>
  );
}
