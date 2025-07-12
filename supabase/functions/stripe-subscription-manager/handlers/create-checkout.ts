
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

interface CheckoutUrlOptions {
  success_url: string;
  cancel_url: string;
}

export async function handleCreateCheckout(
  stripe: Stripe, 
  supabase: any, 
  user: any, 
  req: Request,
  urlOptions: CheckoutUrlOptions
) {
  logStep("Creating checkout session", { 
    userId: user.id,
    successUrl: urlOptions.success_url,
    cancelUrl: urlOptions.cancel_url
  });

  // Check if customer exists in Stripe
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  let customerId;
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
    logStep("Found existing Stripe customer", { customerId });
  } else {
    logStep("No existing Stripe customer found");
  }

  // Build dynamic URLs using the origin from the request
  const origin = req.headers.get("origin") || "https://tryhireme.com";
  const successUrl = `${origin}${urlOptions.success_url}`;
  const cancelUrl = `${origin}${urlOptions.cancel_url}`;
  
  logStep("Using dynamic URLs", { successUrl, cancelUrl });

  // Create checkout session for $0.50/month subscription
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Premium Plan" },
          unit_amount: 50, // $0.50 in cents
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  logStep("Checkout session created", { sessionId: session.id, url: session.url });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
