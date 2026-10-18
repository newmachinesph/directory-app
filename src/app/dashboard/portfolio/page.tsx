"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Clock } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";

export default function PortfolioPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/portfolio")
      .then(r => r.json())
      .then(d => { setImages(d.images || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(imageId: string) {
    await fetch(`/api/dashboard/portfolio?id=${imageId}`, { method: "DELETE" });
    setImages(prev => prev.filter(img => img.id !== imageId));
  }

  if (loading) return <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Portfolio</h1>
        <UploadButton
          endpoint="portfolioImage"
          onClientUploadComplete={(res) => {
            // Refresh the image list
            fetch("/api/dashboard/portfolio").then(r => r.json()).then(d => setImages(d.images || []));
          }}
          onUploadError={(error) => {
            alert(`Upload error: ${error.message}`);
          }}
          appearance={{
            button: "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 rounded-md text-sm font-medium",
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">Images require admin approval before appearing on your profile.</p>
      {images.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No images yet. Upload your portfolio to attract clients.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map(img => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <Image src={img.url} alt={img.caption || "Portfolio"} fill className="object-cover" />
              {!img.isApproved && (
                <div className="absolute top-2 left-2">
                  <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> Pending
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="destructive" onClick={() => handleDelete(img.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
