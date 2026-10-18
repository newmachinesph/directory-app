"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface BlogEditorProps {
  initialPost?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    author: string;
    cover_image: string;
    published_at: string | null;
  };
}

export default function BlogEditor({ initialPost }: BlogEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initialPost?.title || "",
    slug: initialPost?.slug || "",
    excerpt: initialPost?.excerpt || "",
    body: initialPost?.body || "",
    author: initialPost?.author || "The Directory Team",
    coverImage: initialPost?.cover_image || "",
  });

  function update(field: string, value: string) {
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === "title" && !initialPost ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}),
    }));
  }

  async function handleSave(publish: boolean) {
    setSaving(true);
    await fetch("/api/admin/blog", {
      method: initialPost ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, postId: initialPost?.id, publish }),
    });
    setSaving(false);
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">{initialPost ? "Edit Post" : "New Blog Post"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>Publish</Button>
        </div>
      </div>
      <Card><CardContent className="p-6 space-y-4">
        <div className="space-y-2"><Label>Title *</Label><Input required value={form.title} onChange={e => update("title", e.target.value)} /></div>
        <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={e => update("slug", e.target.value)} /></div>
        <div className="space-y-2"><Label>Excerpt</Label><Textarea value={form.excerpt} onChange={e => update("excerpt", e.target.value)} rows={2} /></div>
        <div className="space-y-2"><Label>Body *</Label><Textarea required value={form.body} onChange={e => update("body", e.target.value)} rows={12} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Author</Label><Input value={form.author} onChange={e => update("author", e.target.value)} /></div>
          <div className="space-y-2"><Label>Cover Image URL</Label><Input value={form.coverImage} onChange={e => update("coverImage", e.target.value)} /></div>
        </div>
      </CardContent></Card>
    </div>
  );
}
