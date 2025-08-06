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

    const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!whatsappAccessToken || !whatsappPhoneNumberId) {
      throw new Error('WhatsApp credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
    }

    // Determine message type based on file_type
    let messageType = "document";
    let mediaPayload: any = {
      link: file_url,
      caption: caption || "",
    };

    if (file_type && file_type.startsWith('image/')) {
      messageType = "image";
      mediaPayload = {
        link: file_url,
        caption: caption || "",
      };
    }

    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: mobile_number,
      type: messageType,
      [messageType]: mediaPayload
    };

    console.log('Sending WhatsApp message:', whatsappPayload);

    // Make the actual API call to WhatsApp Business API
    const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whatsappPayload),
    });

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      throw new Error(`WhatsApp API error: ${whatsappData.error?.message || 'Unknown error'}`);
    }

    console.log('WhatsApp API response:', whatsappData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'File sent successfully via WhatsApp',
        whatsapp_message_id: whatsappData.messages?.[0]?.id,
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