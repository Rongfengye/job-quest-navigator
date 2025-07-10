
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email }: PasswordResetRequest = await req.json();
    
    console.log('Password reset requested for:', email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError || !existingUser.user) {
      // For security, we don't reveal if the email exists or not
      console.log('User not found for email:', email);
      return new Response(
        JSON.stringify({ success: true, message: "If this email exists, you will receive a password reset link." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a secure reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Store the reset token in database
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: existingUser.user.id,
        email: email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error('Error storing reset token:', insertError);
      return new Response(
        JSON.stringify({ error: "Failed to process request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create reset URL
    const resetUrl = `https://storyline.tryhireme.com/recover-password?token=${resetToken}`;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Storyline <noreply@storyline.tryhireme.com>",
      to: [email],
      subject: "Reset Your Storyline Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0;">
                  Reset Your Password
                </h1>
                <p style="color: #64748b; font-size: 16px; margin: 8px 0 0 0;">
                  We received a request to reset your Storyline password
                </p>
              </div>

              <!-- Main Content -->
              <div style="margin-bottom: 32px;">
                <p style="color: #475569; font-size: 16px; margin: 0 0 24px 0;">
                  Click the button below to reset your password. This link will expire in 15 minutes for security purposes.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" 
                     style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
                    Reset My Password
                  </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
                  Or copy and paste this link into your browser:<br>
                  <span style="color: #3b82f6; word-break: break-all;">${resetUrl}</span>
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 32px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">
                  <strong>Security Notice:</strong>
                </p>
                <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li>This link will expire in 15 minutes</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                  © ${new Date().getFullYear()} Storyline. All rights reserved.
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
                  This email was sent to ${email}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If this email exists, you will receive a password reset link." 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in password-reset function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process password reset request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
