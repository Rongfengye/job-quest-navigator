
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

export async function handleSyncSubscription(stripe: Stripe, supabase: any, user: any) {
  logStep("Syncing subscription status", { userId: user.id });

  // PHASE 3: Check if user has custom_premium enabled first
  logStep("Checking for custom_premium status");
  const { data: userStatus, error: statusError } = await supabase
    .from("hireme_user_status")
    .select("custom_premium, user_plan_status")
    .eq("user_id", user.id)
    .single();

  if (statusError) {
    logStep("Error fetching user status", { error: statusError });
    // Continue with normal flow if we can't fetch status
  } else if (userStatus?.custom_premium === 1) {
    logStep("User has custom_premium enabled, forcing premium status", { userStatus });
    
    // Force user to premium regardless of Stripe status
    await supabase.rpc("make_user_premium", { user_id: user.id });
    
    return new Response(JSON.stringify({
      subscribed: true,
      plan: "premium",
      custom_premium: true,
      message: "User has custom premium override, maintained premium status"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  logStep("No custom_premium override, proceeding with normal Stripe sync");

  // Check if customer exists in Stripe
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length === 0) {
    logStep("No Stripe customer found, setting to basic");
    
    // Update user to basic plan (only if custom_premium is not 1)
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
    logStep("Calling make_user_premium function", { userId: user.id });
    const premiumResult = await supabase.rpc('make_user_premium', { user_id: user.id });
    logStep("make_user_premium result", { result: premiumResult });

    // Prepare upsert data
    const upsertData = {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_start: subscriptionData.current_period_start,
      current_period_end: subscriptionData.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    };
    
    logStep("Attempting to upsert subscription data", { upsertData });

    // Upsert subscription data with detailed error handling
    try {
      const { data: upsertResult, error: upsertError } = await supabase
        .from("stripe_subscriptions")
        .upsert(upsertData, { onConflict: 'user_id' });
      
      if (upsertError) {
        logStep("ERROR during stripe_subscriptions upsert", { 
          error: upsertError,
          errorMessage: upsertError.message,
          errorCode: upsertError.code,
          errorDetails: upsertError.details,
          errorHint: upsertError.hint 
        });
      } else {
        logStep("Successfully upserted subscription data", { result: upsertResult });
      }

      // Double-check: Query the table to see if the record exists
      const { data: checkData, error: checkError } = await supabase
        .from("stripe_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (checkError) {
        logStep("ERROR checking stripe_subscriptions table after upsert", { 
          error: checkError,
          errorMessage: checkError.message 
        });
      } else {
        logStep("Verification: Found subscription record in database", { record: checkData });
      }

    } catch (dbError) {
      logStep("EXCEPTION during database operations", { 
        error: dbError,
        errorMessage: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }
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
