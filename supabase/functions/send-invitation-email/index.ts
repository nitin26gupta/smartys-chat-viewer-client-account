import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  inviteLink: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviteLink, inviterName = "Admin" }: InvitationEmailRequest = await req.json();

    console.log("Sending invitation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Smartys Chat <nitin26.gupta@gmail.com>", // Using your verified email
      to: [email],
      subject: "You're invited to join Smartys Chat",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Invitation to Smartys Chat</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Smartys Chat</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You've been invited to join our team</p>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${inviterName} has invited you to join the Smartys Chat admin panel. You'll be able to manage chat conversations and customer support.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
              ${inviteLink}
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #999;">
              <p>This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>© 2025 Smartys Chat. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);