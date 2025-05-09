
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Supabase client using environment variables
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Extract path information from headers
    const headers = req.headers;
    const path = headers.get("path") || "";
    const id = headers.get("id") || "";

    // Parse request body if not OPTIONS method
    let body = {};
    if (req.method !== "GET" && req.method !== "OPTIONS") {
      body = await req.json();
    }

    // Handle different API endpoints
    switch (path) {
      case "list":
        return await handleListStudents(req, corsHeaders);

      case "get":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Student ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return await handleGetStudent(id, corsHeaders);

      case "create":
        return await handleCreateStudent(body, corsHeaders);

      case "update":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Student ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return await handleUpdateStudent(id, body, corsHeaders);

      case "delete":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Student ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return await handleDeleteStudent(id, corsHeaders);

      default:
        return new Response(
          JSON.stringify({ error: "Invalid endpoint" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handler functions for different operations

async function handleListStudents(req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url);
  const searchTerm = url.searchParams.get("search") || "";
  
  let query = supabaseClient.from("students").select("*");
  
  // Apply search filter if provided
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,campus.ilike.%${searchTerm}%`);
  }
  
  // Order by creation date descending
  query = query.order("created_at", { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // Transform data to match frontend Student type
  const transformedData = data.map(item => ({
    ...item,
    id: item.id,
    studentId: item.student_id,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at)
  }));
  
  return new Response(
    JSON.stringify(transformedData),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetStudent(id: string, corsHeaders: Record<string, string>) {
  const { data, error } = await supabaseClient
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // Transform data to match frontend Student type
  const transformedData = {
    ...data,
    studentId: data.student_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
  
  return new Response(
    JSON.stringify(transformedData),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCreateStudent(body: any, corsHeaders: Record<string, string>) {
  // Validate required fields
  const requiredFields = ["studentId", "name", "grade", "section", "campus"];
  for (const field of requiredFields) {
    if (!body[field]) {
      return new Response(
        JSON.stringify({ error: `${field} is required` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  
  // Transform data to match database schema
  const studentData = {
    student_id: body.studentId,
    name: body.name,
    grade: body.grade,
    section: body.section,
    campus: body.campus
  };
  
  const { data, error } = await supabaseClient
    .from("students")
    .insert([studentData])
    .select();
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  if (data && data.length > 0) {
    // Transform response data to match frontend Student type
    const transformedData = {
      ...data[0],
      studentId: data[0].student_id,
      createdAt: new Date(data[0].created_at),
      updatedAt: new Date(data[0].updated_at)
    };
    
    return new Response(
      JSON.stringify(transformedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ error: "Failed to create student" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleUpdateStudent(id: string, body: any, corsHeaders: Record<string, string>) {
  // Transform updates to match database schema
  const updates: Record<string, any> = {};
  if (body.studentId) updates.student_id = body.studentId;
  if (body.name) updates.name = body.name;
  if (body.grade) updates.grade = body.grade;
  if (body.section) updates.section = body.section;
  if (body.campus) updates.campus = body.campus;
  
  const { data, error } = await supabaseClient
    .from("students")
    .update(updates)
    .eq("id", id)
    .select();
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  if (data && data.length > 0) {
    // Transform response data to match frontend Student type
    const transformedData = {
      ...data[0],
      studentId: data[0].student_id,
      createdAt: new Date(data[0].created_at),
      updatedAt: new Date(data[0].updated_at)
    };
    
    return new Response(
      JSON.stringify(transformedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ error: "Failed to update student or student not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleDeleteStudent(id: string, corsHeaders: Record<string, string>) {
  const { error } = await supabaseClient
    .from("students")
    .delete()
    .eq("id", id);
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
