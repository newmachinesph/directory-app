"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SubscriptionPage() {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/subscription")
      .then(r => r.json())
      .then(d => { setSub(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (res.ok) { const { url } = await res.json(); window.location.href = url; }
    setPortalLoading(false);
  }

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    past_due: "bg-red-100 text-red-800",
    canceled: "bg-gray-100 text-gray-800",
    incomplete: "bg-yellow-100 text-yellow-800",
    trialing: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold">Subscription</h1>
      {sub?.subscription ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold capitalize">{sub.professional?.tier} Plan</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {sub.subscription.status === "active" && sub.subscription.current_period_end
                    ? `Renews ${new Date(sub.subscription.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                    : "No renewal date"
                  }
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[sub.subscription.status] || ""}`}>
                {sub.subscription.status}
              </span>
            </div>
            {sub.subscription.status === "active" && (
              <Button onClick={openPortal} disabled={portalLoading} variant="outline" className="w-full">
                {portalLoading ? "Loading..." : "Manage Billing in Stripe"}
              </Button>
            )}
            {sub.subscription.status !== "active" && (
              <Link href="/pricing"><Button className="w-full">Reactivate Subscription</Button></Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No active subscription found.</p>
            <Link href="/pricing"><Button>View Plans</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
