import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: "$29",
    description: "Perfect for getting started",
    features: ["Profile listing", "10 portfolio images", "Standard search ranking", "Contact form", "Location search visibility"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$59",
    description: "Most popular for established photographers",
    features: ["Everything in Basic", "30 portfolio images", "Boosted search ranking", "Pro badge on profile", "Priority in category pages"],
    cta: "Get Started",
    highlighted: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "$99",
    description: "Maximum visibility for top professionals",
    features: ["Everything in Professional", "Unlimited portfolio images", "Top search ranking", "Elite badge", "Homepage featured section", "City landing page features"],
    cta: "Get Elite",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold mb-3">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-lg">All plans include a full professional profile. Cancel anytime.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <Card key={tier.id} className={`relative ${tier.highlighted ? "ring-2 ring-primary shadow-lg" : ""}`}>
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <div className="text-4xl font-bold mt-2">{tier.price}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/join`} className="block mt-4">
                <Button className="w-full" variant={tier.highlighted ? "default" : "outline"}>{tier.cta}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-8">
        All listings require manual approval before going live. Subscriptions are billed monthly and can be canceled at any time.
      </p>
    </div>
  );
}
