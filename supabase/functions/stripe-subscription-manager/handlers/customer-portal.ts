import Stripe from "https://esm.sh/stripe@14.21.0";

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-MANAGER] ${step}${detailsStr}`);
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function handleCustomerPortal(stripe: Stripe, supabase: any, user: any, req: Request) {
  logStep("Creating customer portal session", { userId: user.id });

  // Check if customer exists in Stripe
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length === 0) {
    throw new Error("No Stripe customer found for this user");
  }

  const customerId = customers.data[0].id;
  logStep("Found Stripe customer", { customerId });

  // Create customer portal session
  const origin = req.headers.get("origin") || "http://localhost:3000";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/settings`,
  });

  logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

  return new Response(JSON.stringify({ url: portalSession.url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
} 