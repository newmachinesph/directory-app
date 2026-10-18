import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// These price IDs need to be created in Stripe Dashboard > Products
// For demo/testing, we'll create products programmatically if they don't exist
export const TIER_PRICES = {
  basic: { name: "Basic Listing", amount: 2900, interval: "month" as const },
  professional: { name: "Professional Listing", amount: 5900, interval: "month" as const },
  elite: { name: "Elite Listing", amount: 9900, interval: "month" as const },
};

export async function getOrCreatePrice(tier: keyof typeof TIER_PRICES): Promise<string> {
  const config = TIER_PRICES[tier];

  // List all products and find by metadata
  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find(p => p.metadata?.tier === tier);

  if (!product) {
    product = await stripe.products.create({
      name: config.name,
      metadata: { tier },
    });
  }

  // Search for active price on this product
  const prices = await stripe.prices.list({ product: product.id, active: true });
  if (prices.data.length > 0) {
    return prices.data[0].id;
  }

  // Create new price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: config.amount,
    currency: "usd",
    recurring: { interval: config.interval },
    metadata: { tier },
  });
  return price.id;
}
