"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  { id: "boudoir-photographer", label: "Boudoir Photographer" },
  { id: "makeup-artist", label: "Makeup Artist" },
  { id: "hair-stylist", label: "Hair Stylist" },
  { id: "wardrobe-stylist", label: "Wardrobe Stylist" },
  { id: "lingerie-boutique", label: "Lingerie Boutique" },
  { id: "body-painter", label: "Body Painter" },
  { id: "photo-retoucher", label: "Photo Retoucher" },
  { id: "photography-studio", label: "Photography Studio" },
];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", bio: "", specialties: "", website: "", contactPhone: "",
    contactEmail: "", city: "", state: "", zip: "", serviceRadiusMiles: 50,
    selectedCategories: [] as string[],
  });

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then(r => r.json())
      .then(data => {
        if (data.professional) {
          const p = data.professional;
          setForm({
            name: p.name || "",
            bio: p.bio || "",
            specialties: p.specialties || "",
            website: p.website || "",
            contactPhone: p.contact_phone || "",
            contactEmail: p.contact_email || "",
            city: p.city || "",
            state: p.state || "",
            zip: p.zip || "",
            serviceRadiusMiles: p.service_radius_miles || 50,
            selectedCategories: (p.categories || []).map((c: any) => c.slug),
          });
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load profile"); setLoading(false); });
  }, []);

  function update(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleCategory(slug: string) {
    setForm(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(slug)
        ? prev.selectedCategories.filter(c => c !== slug)
        : [...prev.selectedCategories, slug],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else { const d = await res.json(); setError(d.error || "Save failed"); }
  }

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({length:5}).map((_,i) => <div key={i} className="h-10 bg-muted rounded" />)}</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Edit Profile</h1>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card><CardContent className="p-6 space-y-4">
        <CardTitle className="text-base">Basic Info</CardTitle>
        <div className="space-y-2"><Label>Business Name *</Label><Input required value={form.name} onChange={e => update("name", e.target.value)} /></div>
        <div className="space-y-2"><Label>Bio</Label><Textarea value={form.bio} onChange={e => update("bio", e.target.value)} rows={5} /></div>
        <div className="space-y-2"><Label>Specialties</Label><Input value={form.specialties} onChange={e => update("specialties", e.target.value)} placeholder="Boudoir, Empowerment Photography, Fine Art" /></div>
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-4">
        <CardTitle className="text-base">Categories</CardTitle>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.selectedCategories.includes(cat.id) ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary/50"}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-4">
        <CardTitle className="text-base">Contact</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.contactEmail} onChange={e => update("contactEmail", e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>Website</Label><Input type="url" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://..." /></div>
      </CardContent></Card>

      <Card><CardContent className="p-6 space-y-4">
        <CardTitle className="text-base">Location & Service Area</CardTitle>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2"><Label>City</Label><Input value={form.city} onChange={e => update("city", e.target.value)} /></div>
          <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={e => update("state", e.target.value)} maxLength={2} /></div>
        </div>
        <div className="space-y-2"><Label>ZIP</Label><Input value={form.zip} onChange={e => update("zip", e.target.value)} className="w-32" /></div>
        <div className="space-y-2">
          <Label>Service Radius: {form.serviceRadiusMiles} miles</Label>
          <input type="range" min={10} max={200} step={5} value={form.serviceRadiusMiles}
            onChange={e => update("serviceRadiusMiles", parseInt(e.target.value))}
            className="w-full accent-primary" />
        </div>
      </CardContent></Card>
    </form>
  );
}
