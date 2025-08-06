import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Centralized filename sanitization utility
const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';

  // Split filename and extension
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let extension = '';
  
  if (lastDotIndex > 0) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex);
  }

  // Sanitize the name part (keep extension as-is)
  const sanitizedName = name
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Replace parentheses with underscores
    .replace(/[()]/g, '_')
    // Replace em dash, en dash, and other special dashes with regular hyphen
    .replace(/[—–]/g, '-')
    // Replace other problematic characters but keep alphanumeric, hyphens, underscores, and periods
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    // Remove multiple consecutive underscores/hyphens
    .replace(/[_-]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  return sanitizedName + extension;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    const { vehicleId, clientId, documentType, file } = requestBody

    // Convert base64 to Uint8Array
    const base64Data = file.base64.split(',')[1] || file.base64
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Generate sanitized filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFilename = sanitizeFilename(file.name);
    const fileName = `${clientId}/${vehicleId}/${documentType}/${timestamp}_${sanitizedFilename}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('vehicle-documents')
      .upload(fileName, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('vehicle-documents')
      .getPublicUrl(fileName)

    return new Response(
      JSON.stringify({ 
        success: true,
        fileName: sanitizedFilename,
        originalName: file.name,
        path: fileName,
        url: urlData.publicUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Upload Vehicle Document Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
