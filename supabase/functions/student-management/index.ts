import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, path, id",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    // Parse request body if not GET or OPTIONS method
    let body = {};
    if (req.method !== "GET" && req.method !== "OPTIONS") {
      body = await req.json();
    }

    // Handle different API endpoints
    switch (path) {
      case "list":
        return await handleListStudents(req, corsHeaders, body);

      case "get":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Student ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return await handleGetStudent(id, corsHeaders, body);

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
        return await handleDeleteStudent(id, corsHeaders, body);
        
      case "validate":
        return await handleValidateImport(body, corsHeaders);
        
      case "bulk-update":
        return await handleBulkUpdate(body, corsHeaders);

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

async function handleListStudents(req: Request, corsHeaders: Record<string, string>, body: any) {
  const url = new URL(req.url);
  const searchTerm = url.searchParams.get("search") || "";
  const clientId = body.client_id;
  
  let query = supabaseClient.from("students").select("*");
  
  // Filter by client_id if provided
  if (clientId) {
    query = query.eq("client_id", clientId);
  }
  
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
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
  
  return new Response(
    JSON.stringify(transformedData),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetStudent(id: string, corsHeaders: Record<string, string>, body: any) {
  let query = supabaseClient
    .from("students")
    .select("*")
    .eq("id", id);

  // Filter by client_id if provided
  if (body.client_id) {
    query = query.eq("client_id", body.client_id);
  }

  const { data, error } = await query.single();
  
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
    createdAt: data.created_at,
    updatedAt: data.updated_at
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
  
  // Validate campus, grade, and section exist in the database
  const isValid = await validateEducationalStructure(body.campus, body.grade, body.section, body.client_id);
  if (!isValid.valid) {
    return new Response(
      JSON.stringify({ error: isValid.error }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // Transform data to match database schema
  const studentData = {
    student_id: body.studentId,
    name: body.name,
    grade: body.grade,
    section: body.section,
    campus: body.campus,
    client_id: body.client_id
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
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
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

async function validateEducationalStructure(campus: string, grade: string, section: string, clientId?: string) {
  if (!campus || !grade || !section) {
    return { valid: false, error: "Campus, grade and section are all required" };
  }
  
  // Check if campus exists
  let campusQuery = supabaseClient
    .from("campuses")
    .select("id")
    .ilike("name", campus);

  if (clientId) {
    campusQuery = campusQuery.eq("client_id", clientId);
  }

  const { data: campusData, error: campusError } = await campusQuery.maybeSingle();
  
  if (campusError) {
    console.error("Error checking campus:", campusError);
    return { valid: false, error: "Database error while validating campus" };
  }
  
  if (!campusData) {
    return { valid: false, error: `Campus "${campus}" does not exist in the system` };
  }
  
  // Check if grade exists and belongs to the campus
  let gradeQuery = supabaseClient
    .from("grades")
    .select("id")
    .ilike("name", grade)
    .eq("campus_id", campusData.id);

  if (clientId) {
    gradeQuery = gradeQuery.eq("client_id", clientId);
  }

  const { data: gradeData, error: gradeError } = await gradeQuery.maybeSingle();
  
  if (gradeError) {
    console.error("Error checking grade:", gradeError);
    return { valid: false, error: "Database error while validating grade" };
  }
  
  if (!gradeData) {
    return { valid: false, error: `Grade "${grade}" does not exist for campus "${campus}"` };
  }
  
  // Check if section exists and belongs to the grade
  let sectionQuery = supabaseClient
    .from("sections")
    .select("id")
    .ilike("name", section)
    .eq("grade_id", gradeData.id);

  if (clientId) {
    sectionQuery = sectionQuery.eq("client_id", clientId);
  }

  const { data: sectionData, error: sectionError } = await sectionQuery.maybeSingle();
  
  if (sectionError) {
    console.error("Error checking section:", sectionError);
    return { valid: false, error: "Database error while validating section" };
  }
  
  if (!sectionData) {
    return { valid: false, error: `Section "${section}" does not exist for grade "${grade}"` };
  }
  
  return { valid: true, error: null };
}

async function handleValidateImport(body: any, corsHeaders: Record<string, string>) {
  const students = body.students || [];
  const clientId = body.client_id;
  
  if (!Array.isArray(students) || students.length === 0) {
    return new Response(
      JSON.stringify({ error: "No student data provided" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  const errors: string[] = [];
  const validEntries: Record<string, boolean> = {};
  
  // Get all distinct campuses, grades, and sections from the import data
  const uniqueCampuses = new Set(students.map(s => s.campus?.toLowerCase()));
  const uniqueGrades = new Set(students.map(s => s.grade?.toLowerCase()));
  const uniqueSections = new Set(students.map(s => s.section?.toLowerCase()));
  
  // Fetch all valid campuses, grades and sections for this client
  let campusQuery = supabaseClient.from("campuses").select("id, name");
  if (clientId) {
    campusQuery = campusQuery.eq("client_id", clientId);
  }
  const { data: campusData, error: campusError } = await campusQuery;
  
  if (campusError) {
    return new Response(
      JSON.stringify({ error: "Database error while validating campuses" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  let gradeQuery = supabaseClient.from("grades").select("id, name, campus_id");
  if (clientId) {
    gradeQuery = gradeQuery.eq("client_id", clientId);
  }
  const { data: gradeData, error: gradeError } = await gradeQuery;
  
  if (gradeError) {
    return new Response(
      JSON.stringify({ error: "Database error while validating grades" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  let sectionQuery = supabaseClient.from("sections").select("id, name, grade_id");
  if (clientId) {
    sectionQuery = sectionQuery.eq("client_id", clientId);
  }
  const { data: sectionData, error: sectionError } = await sectionQuery;
  
  if (sectionError) {
    return new Response(
      JSON.stringify({ error: "Database error while validating sections" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // Create validation maps
  const validCampuses = new Map(campusData.map(c => [c.name.toLowerCase(), c.id]));
  const validGrades = new Map();
  const validSections = new Map();
  
  // Build grade validation map (keyed by campus_id + grade_name)
  gradeData.forEach(g => {
    const key = `${g.campus_id}:${g.name.toLowerCase()}`;
    validGrades.set(key, g.id);
  });
  
  // Build section validation map (keyed by grade_id + section_name)
  sectionData.forEach(s => {
    const key = `${s.grade_id}:${s.name.toLowerCase()}`;
    validSections.set(key, s.id);
  });
  
  // Validate each student record
  students.forEach((student, index) => {
    const rowNumber = index + 2; // +2 for header row and 1-indexed counting
    
    if (!student.campus || typeof student.campus !== 'string' || !student.campus.trim()) {
      errors.push(`Row ${rowNumber}: Campus is required`);
      return;
    }
    
    if (!student.grade || typeof student.grade !== 'string' || !student.grade.trim()) {
      errors.push(`Row ${rowNumber}: Grade is required`);
      return;
    }
    
    if (!student.section || typeof student.section !== 'string' || !student.section.trim()) {
      errors.push(`Row ${rowNumber}: Section is required`);
      return;
    }
    
    // Check campus exists
    const campusLower = student.campus.toLowerCase();
    const campusId = validCampuses.get(campusLower);
    if (!campusId) {
      errors.push(`Row ${rowNumber}: Campus "${student.campus}" does not exist in the system`);
      return;
    }
    
    // Check grade exists and belongs to the campus
    const gradeKey = `${campusId}:${student.grade.toLowerCase()}`;
    const gradeId = validGrades.get(gradeKey);
    
    if (!gradeId) {
      errors.push(`Row ${rowNumber}: Grade "${student.grade}" does not exist for campus "${student.campus}"`);
      return;
    }
    
    // Check section exists and belongs to the grade
    const sectionKey = `${gradeId}:${student.section.toLowerCase()}`;
    const sectionValid = validSections.has(sectionKey);
    
    if (!sectionValid) {
      errors.push(`Row ${rowNumber}: Section "${student.section}" does not exist for grade "${student.grade}"`);
      return;
    }
  });
  
  return new Response(
    JSON.stringify({
      valid: errors.length === 0,
      errors: errors
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleUpdateStudent(id: string, body: any, corsHeaders: Record<string, string>) {
  // Validate campus, grade, and section if they are being updated
  if (body.campus && body.grade && body.section) {
    const isValid = await validateEducationalStructure(body.campus, body.grade, body.section, body.client_id);
    if (!isValid.valid) {
      return new Response(
        JSON.stringify({ error: isValid.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  
  // Transform updates to match database schema
  const updates: Record<string, any> = {};
  if (body.studentId) updates.student_id = body.studentId;
  if (body.name) updates.name = body.name;
  if (body.grade) updates.grade = body.grade;
  if (body.section) updates.section = body.section;
  if (body.campus) updates.campus = body.campus;
  if (body.client_id) updates.client_id = body.client_id;
  
  let query = supabaseClient
    .from("students")
    .update(updates)
    .eq("id", id);

  // Filter by client_id if provided
  if (body.client_id) {
    query = query.eq("client_id", body.client_id);
  }

  const { data, error } = await query.select();
  
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
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
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

async function handleDeleteStudent(id: string, corsHeaders: Record<string, string>, body: any) {
  let query = supabaseClient
    .from("students")
    .delete()
    .eq("id", id);

  // Filter by client_id if provided
  if (body.client_id) {
    query = query.eq("client_id", body.client_id);
  }

  const { error } = await query;
  
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

/**
 * Handle bulk update of students
 * This function processes a batch of student updates in a single operation
 */
async function handleBulkUpdate(body: any, corsHeaders: Record<string, string>) {
  const students = body.students || [];
  const clientId = body.client_id;
  
  if (!Array.isArray(students) || students.length === 0) {
    return new Response(
      JSON.stringify({ error: "No student data provided for update" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`Processing bulk update for ${students.length} students`);
  
  try {
    const updatedStudents = [];
    let successCount = 0;
    
    // Process students in batches to avoid potential limitations
    const BATCH_SIZE = 50;
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      
      // For each student in batch, prepare update
      for (const student of batch) {
        if (!student.id) {
          console.error("Student ID missing in update request", student);
          continue;
        }
        
        // Extract updates for this student
        const { id, ...updates } = student;
        
        // Add client_id to updates
        if (clientId) {
          updates.client_id = clientId;
        }
        
        // Apply update with client_id filter
        let query = supabaseClient
          .from("students")
          .update(updates)
          .eq("id", id);

        if (clientId) {
          query = query.eq("client_id", clientId);
        }

        const { data, error } = await query.select();
        
        if (error) {
          console.error(`Error updating student ${id}:`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          updatedStudents.push({
            ...data[0],
            studentId: data[0].student_id,
            createdAt: data[0].created_at,
            updatedAt: data[0].updated_at
          });
          successCount++;
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        updated: true,
        count: successCount,
        students: updatedStudents
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bulk update:", error);
    return new Response(
      JSON.stringify({ error: `Bulk update failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
