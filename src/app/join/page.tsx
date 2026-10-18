"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";

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

interface FormData {
  // Step 1: Account
  email: string;
  password: string;
  // Step 2: Profile
  name: string;
  bio: string;
  specialties: string;
  categories: string[];
  website: string;
  contactPhone: string;
  // Step 3: Location
  city: string;
  state: string;
  zip: string;
  serviceRadius: number;
  // Step 4: Subscription tier
  tier: "basic" | "professional" | "elite";
}

const TIERS = [
  { id: "basic", label: "Basic", price: "$29/mo", features: ["Profile listing", "10 portfolio images", "Standard ranking", "Contact form"] },
  { id: "professional", label: "Professional", price: "$59/mo", features: ["Everything in Basic", "30 portfolio images", "Boosted ranking", "Pro badge"] },
  { id: "elite", label: "Elite", price: "$99/mo", features: ["Everything in Pro", "Unlimited images", "Top search ranking", "Elite badge", "Homepage feature"] },
];

export default function JoinPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(session ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    email: "", password: "",
    name: "", bio: "", specialties: "", categories: [], website: "", contactPhone: "",
    city: "", state: "", zip: "", serviceRadius: 50,
    tier: "professional",
  });

  function update(field: keyof FormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleCategory(slug: string) {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter(c => c !== slug)
        : [...prev.categories, slug],
    }));
  }

  async function handleNext() {
    setError("");
    setLoading(true);

    try {
      if (step === 1) {
        // Create account
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Registration failed");
        }
        // Auto sign in
        const { signIn } = await import("next-auth/react");
        await signIn("credentials", { email: form.email, password: form.password, redirect: false });
        setStep(2);
      } else if (step === 2) {
        if (!form.name || form.categories.length === 0) throw new Error("Please fill all required fields");
        setStep(3);
      } else if (step === 3) {
        if (!form.city || !form.state) throw new Error("Please enter your city and state");
        setStep(4);
      } else if (step === 4) {
        // Submit application
        const res = await fetch("/api/professionals/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Submission failed");
        }
        const data = await res.json();
        setProfessionalId(data.professionalId);
        // Redirect to Stripe checkout
        const checkoutRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: form.tier, professionalId: data.professionalId }),
        });
        if (checkoutRes.ok) {
          const { url } = await checkoutRes.json();
          window.location.href = url;
        } else {
          router.push("/dashboard");
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const STEPS = session ? [
    "Profile", "Location", "Subscription"
  ] : [
    "Account", "Profile", "Location", "Subscription"
  ];
  const totalSteps = STEPS.length;
  const currentStepDisplay = session ? step - 1 : step;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">Join BoudoirDirectory</h1>
        <p className="text-muted-foreground">Apply to be listed as a vetted professional</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const stepNum = session ? i + 2 : i + 1;
          const active = step === stepNum;
          const done = step > stepNum;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {done ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${active ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Step 1: Account */}
          {step === 1 && (
            <>
              <div><CardTitle className="text-lg mb-1">Create Your Account</CardTitle><CardDescription>You&apos;ll use this to manage your listing.</CardDescription></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" /></div>
              <div className="space-y-2"><Label>Password *</Label><Input type="password" required value={form.password} onChange={e => update("password", e.target.value)} placeholder="Min 8 characters" minLength={8} /></div>
            </>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <>
              <div><CardTitle className="text-lg mb-1">Your Profile</CardTitle><CardDescription>Tell potential clients about your work.</CardDescription></div>
              <div className="space-y-2"><Label>Business / Studio Name *</Label><Input required value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Velvet Rose Boudoir" /></div>
              <div className="space-y-2"><Label>Bio *</Label><Textarea required value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Tell clients about your style, experience, and what makes you unique..." rows={4} /></div>
              <div className="space-y-2"><Label>Specialties</Label><Input value={form.specialties} onChange={e => update("specialties", e.target.value)} placeholder="e.g. Boudoir, Empowerment Photography, Fine Art" /></div>
              <div className="space-y-2">
                <Label>Categories * (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.categories.includes(cat.id) ? "bg-primary text-primary-foreground border-primary" : "border-input hover:border-primary/50"}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Website</Label><Input type="url" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://..." /></div>
                <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)} placeholder="(555) 000-0000" /></div>
              </div>
            </>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <>
              <div><CardTitle className="text-lg mb-1">Your Location</CardTitle><CardDescription>Where are you based? How far do you travel?</CardDescription></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>City *</Label><Input required value={form.city} onChange={e => update("city", e.target.value)} placeholder="Nashville" /></div>
                <div className="space-y-2"><Label>State *</Label><Input required value={form.state} onChange={e => update("state", e.target.value)} placeholder="TN" maxLength={2} /></div>
              </div>
              <div className="space-y-2"><Label>ZIP Code</Label><Input value={form.zip} onChange={e => update("zip", e.target.value)} placeholder="37201" /></div>
              <div className="space-y-2">
                <Label>Service Radius: {form.serviceRadius} miles</Label>
                <input type="range" min={10} max={200} step={5} value={form.serviceRadius}
                  onChange={e => update("serviceRadius", parseInt(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>10 mi</span><span>200 mi</span></div>
              </div>
            </>
          )}

          {/* Step 4: Subscription tier */}
          {step === 4 && (
            <>
              <div><CardTitle className="text-lg mb-1">Choose Your Plan</CardTitle><CardDescription>You&apos;ll be redirected to Stripe to complete payment. Your listing will be reviewed after payment.</CardDescription></div>
              <div className="grid grid-cols-1 gap-3">
                {TIERS.map(tier => (
                  <button key={tier.id} type="button" onClick={() => update("tier", tier.id as any)}
                    className={`text-left p-4 rounded-lg border-2 transition-colors ${form.tier === tier.id ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"}`}>
                    <div className="flex justify-between items-start">
                      <div><div className="font-semibold">{tier.label}</div><div className="text-lg font-bold text-primary mt-0.5">{tier.price}</div></div>
                      {form.tier === tier.id && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {tier.features.map(f => <li key={f} className="text-xs text-muted-foreground">✓ {f}</li>)}
                    </ul>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between pt-2">
            {step > (session ? 2 : 1) && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={loading}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={loading} className="ml-auto">
              {loading ? "Processing..." : step === 4 ? "Proceed to Payment" : "Continue"} {step < 4 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
