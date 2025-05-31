
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  return null;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get the Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get data from request
    const { vehicleId, files, documentInfo } = await req.json();
    
    console.log(`Processing upload for vehicle: ${vehicleId}`);
    console.log(`Number of files: ${files.length}`);
    
    // Ensure we have a valid vehicle ID
    if (!vehicleId) {
      return new Response(
        JSON.stringify({ error: "Vehicle ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const uploadTime = new Date().toISOString();
    const uploadResults = [];
    
    // Upload each file to storage
    for (const file of files) {
      const { fileName, contentType, base64Data } = file;
      
      // Remove the data:image/jpeg;base64, part
      const base64 = base64Data.split(',')[1];
      
      // Create a clean filename
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Add timestamp and random string to ensure uniqueness
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const filePath = `${vehicleId}/${timestamp}_${randomStr}_${cleanFileName}`;
      
      console.log(`Uploading ${filePath}`);
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true
        });
        
      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        uploadResults.push({
          fileName,
          error: uploadError.message,
          success: false
        });
        continue;
      }
      
      // Get public URL - Constructing the correct URL format
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(filePath);
        
      uploadResults.push({
        fileName,
        filePath,
        publicUrl,
        success: true,
        uploadTime
      });
    }
    
    // Prepare document data
    const documentData = {
      name: documentInfo?.name || 'Uploaded Document',
      type: documentInfo?.type || 'general',
      uploadedAt: uploadTime,
      files: uploadResults.filter(r => r.success).map(r => ({
        name: r.fileName,
        path: r.filePath,
        url: r.publicUrl,
        uploadedAt: r.uploadTime
      }))
    };
    
    // Check if there's an existing record for this vehicle
    const { data: existingDocs, error: fetchError } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error fetching existing documents:", fetchError);
      return new Response(
        JSON.stringify({ error: "Error fetching existing documents", details: fetchError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    let result;
    
    if (existingDocs) {
      // Update existing record
      const updatedDocuments = [...existingDocs.documents, documentData];
      
      const { data, error: updateError } = await supabase
        .from('vehicle_documents')
        .update({ documents: updatedDocuments })
        .eq('vehicle_id', vehicleId)
        .select();
        
      if (updateError) {
        console.error("Error updating documents:", updateError);
        return new Response(
          JSON.stringify({ error: "Error updating documents", details: updateError }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      result = data;
    } else {
      // Insert new record
      const { data, error: insertError } = await supabase
        .from('vehicle_documents')
        .insert([
          { vehicle_id: vehicleId, documents: [documentData] }
        ])
        .select();
        
      if (insertError) {
        console.error("Error inserting documents:", insertError);
        return new Response(
          JSON.stringify({ error: "Error inserting documents", details: insertError }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      result = data;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        uploadResults,
        documentData,
        result
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Utility function to decode base64
function decode(base64: string): Uint8Array {
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}
