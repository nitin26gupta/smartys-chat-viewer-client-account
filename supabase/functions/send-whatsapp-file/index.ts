import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mobile_number, file_url, caption, file_type } = await req.json();

    console.log('Received file send request:', { mobile_number, file_url, caption, file_type });

    if (!mobile_number || !file_url) {
      throw new Error('Missing required parameters: mobile_number and file_url');
    }

    // This would typically integrate with your WhatsApp Business API
    // For now, we'll just log the request and return success
    // You would replace this with actual WhatsApp API integration
    
    const whatsappPayload = {
      to: mobile_number,
      type: "document", // or "image" based on file_type
      document: {
        link: file_url,
        caption: caption || "",
        filename: caption || "document"
      }
    };

    console.log('Would send WhatsApp message:', whatsappPayload);

    // Here you would make the actual API call to WhatsApp Business API
    // Example:
    // const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(whatsappPayload),
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'File send request processed',
        payload: whatsappPayload 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in send-whatsapp-file function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});