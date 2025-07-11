import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-MANAGER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Stripe and Supabase clients
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request data
    const requestData = await req.json();
    const { action } = requestData;
    logStep("Request parsed", { action });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Route based on action
    switch (action) {
      case "CREATE_CHECKOUT":
        return await handleCreateCheckout(stripe, supabaseClient, user, req);
      case "SYNC_SUBSCRIPTION":
        return await handleSyncSubscription(stripe, supabaseClient, user);
      case "CUSTOMER_PORTAL":
        return await handleCustomerPortal(stripe, supabaseClient, user, req);
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-subscription-manager", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCreateCheckout(stripe: Stripe, supabase: any, user: any, req: Request) {
  logStep("Creating checkout session", { userId: user.id });

  // Check if customer exists in Stripe
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  let customerId;
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
    logStep("Found existing Stripe customer", { customerId });
  } else {
    logStep("No existing Stripe customer found");
  }

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
    success_url: `${req.headers.get("origin")}/dashboard`,
    cancel_url: `${req.headers.get("origin")}/settings`,
  });

  logStep("Checkout session created", { sessionId: session.id, url: session.url });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleSyncSubscription(stripe: Stripe, supabase: any, user: any) {
  logStep("Syncing subscription status", { userId: user.id });

  // Check if customer exists in Stripe
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length === 0) {
    logStep("No Stripe customer found, setting to basic");
    
    // Update user to basic plan
    await supabase.rpc('make_user_basic', { user_id: user.id });
    
    return new Response(JSON.stringify({ 
      subscribed: false, 
      plan: "basic",
      message: "No subscription found" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const customerId = customers.data[0].id;
  logStep("Found Stripe customer", { customerId });

  // Get active subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  const hasActiveSub = subscriptions.data.length > 0;
  let subscriptionData = null;

  if (hasActiveSub) {
    const subscription = subscriptions.data[0];
    subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    };
    
    logStep("Active subscription found", subscriptionData);

    // Update user to premium plan
    await supabase.rpc('make_user_premium', { user_id: user.id });

    // Upsert subscription data
    await supabase.from("stripe_subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_start: subscriptionData.current_period_start,
      current_period_end: subscriptionData.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } else {
    logStep("No active subscription found");
    
    // Update user to basic plan
    await supabase.rpc('make_user_basic', { user_id: user.id });
  }

  return new Response(JSON.stringify({
    subscribed: hasActiveSub,
    plan: hasActiveSub ? "premium" : "basic",
    subscription: subscriptionData,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleCustomerPortal(stripe: Stripe, supabase: any, user: any, req: Request) {
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
