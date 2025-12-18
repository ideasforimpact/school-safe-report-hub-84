import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

// Set up CORS headers for cross-origin requests - Added client-id to allowed headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, path, id, client-id",
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
    const clientIdFromHeader = headers.get("client-id") || "";

    // Parse request body if not GET or OPTIONS method
    let body = {};
    if (req.method !== "GET" && req.method !== "OPTIONS") {
      body = await req.json();
    }

    // Get clientId from body or header for IP validation
    const clientIdForValidation = body.client_id || clientIdFromHeader;
    
    // Validate IP whitelist if clientId is available
    if (clientIdForValidation) {
      const url = new URL(req.url);
      const ipValidation = await validateIPWhitelist(
        supabaseClient,
        req,
        clientIdForValidation,
        url.pathname
      );
      
      if (!ipValidation.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'IP_NOT_WHITELISTED',
            message: 'Access denied. Your IP address is not whitelisted for this client.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
        // Extract client_id from header or body for validation
        const validationBody = { ...body };
        if (clientIdFromHeader && !validationBody.client_id) {
          validationBody.client_id = clientIdFromHeader;
        }
        return await handleValidateImport(validationBody, corsHeaders);
        
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

// Helper function to normalize strings for comparison
function normalizeString(str: string): string {
  if (!str) return "";
  return str.trim().toLowerCase();
}

// Helper function to create a case-insensitive comparison map
function createNormalizedMap<T>(items: T[], keySelector: (item: T) => string, valueSelector: (item: T) => any): Map<string, any> {
  const map = new Map();
  items.forEach(item => {
    const normalizedKey = normalizeString(keySelector(item));
    map.set(normalizedKey, valueSelector(item));
  });
  return map;
}

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
  const requiredFields = ["studentId", "name"];
  for (const field of requiredFields) {
    if (!body[field]) {
      return new Response(
        JSON.stringify({ error: `${field} is required` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Check for either IDs (preferred) or text values (backward compatibility)
  const hasIds = body.campusId && body.gradeId && body.sectionId;
  const hasTextValues = body.campus && body.grade && body.section;
  
  if (!hasIds && !hasTextValues) {
    return new Response(
      JSON.stringify({ error: "Either campusId/gradeId/sectionId or campus/grade/section are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Enhanced duplicate checking with client-specific validation
  if (body.client_id) {
    const { data: existingStudent, error: checkError } = await supabaseClient
      .from("students")
      .select("id")
      .eq("student_id", body.studentId)
      .eq("client_id", body.client_id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing student ID:", checkError);
      return new Response(
        JSON.stringify({ error: "Error validating student ID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingStudent) {
      return new Response(
        JSON.stringify({ error: `Student ID "${body.studentId}" already exists in your organization` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  
  // If IDs are provided, validate they exist and belong to the client
  if (hasIds) {
    // Validate campus_id
    const { data: campusData, error: campusError } = await supabaseClient
      .from("campuses")
      .select("id, name")
      .eq("id", body.campusId)
      .eq("client_id", body.client_id)
      .maybeSingle();
    
    if (campusError || !campusData) {
      return new Response(
        JSON.stringify({ error: "Invalid campus ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate grade_id
    const { data: gradeData, error: gradeError } = await supabaseClient
      .from("grades")
      .select("id, name, campus_id")
      .eq("id", body.gradeId)
      .eq("client_id", body.client_id)
      .maybeSingle();
    
    if (gradeError || !gradeData) {
      return new Response(
        JSON.stringify({ error: "Invalid grade ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that grade belongs to the selected campus
    if (gradeData.campus_id !== body.campusId) {
      return new Response(
        JSON.stringify({ error: "Grade does not belong to the selected campus" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate section_id
    const { data: sectionData, error: sectionError } = await supabaseClient
      .from("sections")
      .select("id, name, grade_id, campus_id")
      .eq("id", body.sectionId)
      .eq("client_id", body.client_id)
      .maybeSingle();
    
    if (sectionError || !sectionData) {
      return new Response(
        JSON.stringify({ error: "Invalid section ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that section belongs to the selected grade
    if (sectionData.grade_id !== body.gradeId) {
      return new Response(
        JSON.stringify({ error: "Section does not belong to the selected grade" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the names from the validated records
    body.campus = campusData.name;
    body.grade = gradeData.name;
    body.section = sectionData.name;
  } else {
    // Fallback: Validate campus, grade, and section using text values (backward compatibility)
  if (body.campus && body.grade && body.section) {
    const isValid = await validateEducationalStructure(body.campus, body.grade, body.section, body.client_id);
    if (!isValid.valid) {
      return new Response(
        JSON.stringify({ error: isValid.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      }
    }
  }
  
  // Transform data to match database schema
  const studentData: any = {
    student_id: body.studentId,
    name: body.name,
    grade: body.grade,
    section: body.section,
    campus: body.campus,
    client_id: body.client_id
  };

  // Add IDs if provided
  if (hasIds) {
    studentData.campus_id = body.campusId;
    studentData.grade_id = body.gradeId;
    studentData.section_id = body.sectionId;
  }
  
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
  
  // Normalize input strings
  const normalizedCampus = normalizeString(campus);
  const normalizedGrade = normalizeString(grade);
  const normalizedSection = normalizeString(section);
  
  console.log(`Validating educational structure:`, {
    original: { campus, grade, section },
    normalized: { campus: normalizedCampus, grade: normalizedGrade, section: normalizedSection },
    clientId
  });
  
  // Check if campus exists with enhanced matching
  let campusQuery = supabaseClient
    .from("campuses")
    .select("id, name");

  if (clientId) {
    campusQuery = campusQuery.eq("client_id", clientId);
  }

  const { data: allCampuses, error: campusError } = await campusQuery;
  
  if (campusError) {
    console.error("Error checking campus:", campusError);
    return { valid: false, error: "Database error while validating campus" };
  }
  
  console.log("Available campuses:", allCampuses);
  
  // Find matching campus with case-insensitive matching
  const matchingCampus = allCampuses?.find(c => {
    const normalizedCampusName = normalizeString(c.name);
    return normalizedCampusName === normalizedCampus;
  });
  
  if (!matchingCampus) {
    const availableCampuses = Array.from(validCampuses.keys()).join(", ") || "none";
    return { 
      valid: false, 
      error: `Campus "${campus}" does not exist in the system. Available: ${availableCampuses}` 
    };
  }
  
  console.log("Found matching campus:", matchingCampus);
  
  // Check if grade exists and belongs to the campus
  let gradeQuery = supabaseClient
    .from("grades")
    .select("id, name, campus_id")
    .eq("campus_id", matchingCampus.id);

  if (clientId) {
    gradeQuery = gradeQuery.eq("client_id", clientId);
  }

  const { data: allGrades, error: gradeError } = await gradeQuery;
  
  if (gradeError) {
    console.error("Error checking grade:", gradeError);
    return { valid: false, error: "Database error while validating grade" };
  }
  
  console.log("Available grades for campus:", allGrades);
  
  // Find matching grade with case-insensitive matching
  const matchingGrade = allGrades?.find(g => {
    const normalizedGradeName = normalizeString(g.name);
    return normalizedGradeName === normalizedGrade;
  });
  
  if (!matchingGrade) {
    const availableGrades = Array.from(validGrades.keys())
      .filter(key => key.startsWith(`${campusId}:`))
      .map(key => key.split(':')[1])
      .join(", ") || "none";
    return { 
      valid: false, 
      error: `Grade "${grade}" does not exist for campus "${campus}". Available: ${availableGrades}` 
    };
  }
  
  console.log("Found matching grade:", matchingGrade);
  
  // Check if section exists and belongs to the grade
  let sectionQuery = supabaseClient
    .from("sections")
    .select("id, name, grade_id")
    .eq("grade_id", matchingGrade.id);

  if (clientId) {
    sectionQuery = sectionQuery.eq("client_id", clientId);
  }

  const { data: allSections, error: sectionError } = await sectionQuery;
  
  if (sectionError) {
    console.error("Error checking section:", sectionError);
    return { valid: false, error: "Database error while validating section" };
  }
  
  console.log("Available sections for grade:", allSections);
  
  // Find matching section with case-insensitive matching
  const matchingSection = allSections?.find(s => {
    const normalizedSectionName = normalizeString(s.name);
    return normalizedSectionName === normalizedSection;
  });
  
  if (!matchingSection) {
    const availableSections = Array.from(validSections.keys())
      .filter(key => key.startsWith(`${gradeId}:`))
      .map(key => key.split(':')[1])
      .join(", ") || "none";
    return { 
      valid: false, 
      error: `Section "${section}" does not exist for grade "${grade}". Available: ${availableSections}` 
    };
  }
  
  console.log("Validation successful - all structures found");
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

  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "Client ID is required for validation" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`Starting validation for ${students.length} students with client ID: ${clientId}`);
  
  const errors: string[] = [];
  
  // First, check for duplicate student IDs within this client
  const studentIds = students.map(s => s.studentId).filter(id => id);
  if (studentIds.length > 0) {
    const { data: existingStudents, error: duplicateError } = await supabaseClient
      .from("students")
      .select("student_id")
      .eq("client_id", clientId)
      .in("student_id", studentIds);

    if (duplicateError) {
      return new Response(
        JSON.stringify({ error: "Database error while checking for duplicate student IDs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingStudents && existingStudents.length > 0) {
      existingStudents.forEach(existing => {
        const rowIndex = students.findIndex(s => s.studentId === existing.student_id);
        const rowNumber = rowIndex >= 0 ? rowIndex + 2 : 'Unknown';
        errors.push(`Row ${rowNumber}: Student ID "${existing.student_id}" already exists in your organization`);
      });
    }
  }

  // If there are duplicate errors, return them immediately
  if (errors.length > 0) {
    return new Response(
      JSON.stringify({
        valid: false,
        errors: errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

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

  console.log("Fetched data:", {
    campuses: campusData?.length || 0,
    grades: gradeData?.length || 0,
    sections: sectionData?.length || 0
  });
  
  // Create normalized validation maps for case-insensitive matching
  const validCampuses = createNormalizedMap(campusData || [], c => c.name, c => c.id);
  const validGrades = new Map();
  const validSections = new Map();
  
  // Build grade validation map (keyed by campus_id + normalized grade_name)
  (gradeData || []).forEach(g => {
    const key = `${g.campus_id}:${normalizeString(g.name)}`;
    validGrades.set(key, g.id);
  });
  
  // Build section validation map (keyed by grade_id + normalized section_name)
  (sectionData || []).forEach(s => {
    const key = `${s.grade_id}:${normalizeString(s.name)}`;
    validSections.set(key, s.id);
  });

  console.log("Created validation maps:", {
    campusKeys: Array.from(validCampuses.keys()),
    gradeKeys: Array.from(validGrades.keys()),
    sectionKeys: Array.from(validSections.keys())
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
    
    // Normalize student data for comparison
    const normalizedCampus = normalizeString(student.campus);
    const normalizedGrade = normalizeString(student.grade);
    const normalizedSection = normalizeString(student.section);

    console.log(`Validating student ${rowNumber}:`, {
      original: { campus: student.campus, grade: student.grade, section: student.section },
      normalized: { campus: normalizedCampus, grade: normalizedGrade, section: normalizedSection }
    });
    
    // Check campus exists
    const campusId = validCampuses.get(normalizedCampus);
    if (!campusId) {
      const availableCampuses = Array.from(validCampuses.keys()).join(", ") || "none";
      errors.push(`Row ${rowNumber}: Campus "${student.campus}" does not exist in the system. Available: ${availableCampuses}`);
      return;
    }
    
    // Check grade exists and belongs to the campus
    const gradeKey = `${campusId}:${normalizedGrade}`;
    const gradeId = validGrades.get(gradeKey);
    
    if (!gradeId) {
      const availableGrades = Array.from(validGrades.keys())
        .filter(key => key.startsWith(`${campusId}:`))
        .map(key => key.split(':')[1])
        .join(", ") || "none";
      errors.push(`Row ${rowNumber}: Grade "${student.grade}" does not exist for campus "${student.campus}". Available: ${availableGrades}`);
      return;
    }
    
    // Check section exists and belongs to the grade
    const sectionKey = `${gradeId}:${normalizedSection}`;
    const sectionValid = validSections.has(sectionKey);
    
    if (!sectionValid) {
      const availableSections = Array.from(validSections.keys())
        .filter(key => key.startsWith(`${gradeId}:`))
        .map(key => key.split(':')[1])
        .join(", ") || "none";
      errors.push(`Row ${rowNumber}: Section "${student.section}" does not exist for grade "${student.grade}". Available: ${availableSections}`);
      return;
    }

    console.log(`Student ${rowNumber} validation successful`);
  });
  
  console.log(`Validation complete. Found ${errors.length} errors.`);
  
  return new Response(
    JSON.stringify({
      valid: errors.length === 0,
      errors: errors
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleUpdateStudent(id: string, body: any, corsHeaders: Record<string, string>) {
  // Check if student ID already exists for this client (if student ID is being updated)
  if (body.studentId && body.client_id) {
    const { data: existingStudent, error: checkError } = await supabaseClient
      .from("students")
      .select("id")
      .eq("student_id", body.studentId)
      .eq("client_id", body.client_id)
      .neq("id", id) // Exclude the current student being updated
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing student ID:", checkError);
      return new Response(
        JSON.stringify({ error: "Error validating student ID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingStudent) {
      return new Response(
        JSON.stringify({ error: "Student ID already exists for this client" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Detect if ID-based educational structure is being provided
  const hasIds = body.campusId && body.gradeId && body.sectionId;

  // If any of the IDs are provided, require all three
  if ((body.campusId || body.gradeId || body.sectionId) && !hasIds) {
    return new Response(
      JSON.stringify({ error: "campusId, gradeId and sectionId must all be provided together when updating educational structure" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // When IDs are provided, validate them and derive the text names
  if (hasIds && body.client_id) {
    // Validate campus_id
    const { data: campusData, error: campusError } = await supabaseClient
      .from("campuses")
      .select("id, name")
      .eq("id", body.campusId)
      .eq("client_id", body.client_id)
      .maybeSingle();

    if (campusError || !campusData) {
      return new Response(
        JSON.stringify({ error: "Invalid campus ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate grade_id
    const { data: gradeData, error: gradeError } = await supabaseClient
      .from("grades")
      .select("id, name, campus_id")
      .eq("id", body.gradeId)
      .eq("client_id", body.client_id)
      .maybeSingle();

    if (gradeError || !gradeData) {
      return new Response(
        JSON.stringify({ error: "Invalid grade ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (gradeData.campus_id !== body.campusId) {
      return new Response(
        JSON.stringify({ error: "Grade does not belong to the selected campus" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate section_id
    const { data: sectionData, error: sectionError } = await supabaseClient
      .from("sections")
      .select("id, name, grade_id")
      .eq("id", body.sectionId)
      .eq("client_id", body.client_id)
      .maybeSingle();

    if (sectionError || !sectionData) {
      return new Response(
        JSON.stringify({ error: "Invalid section ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (sectionData.grade_id !== body.gradeId) {
      return new Response(
        JSON.stringify({ error: "Section does not belong to the selected grade" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Derive and attach the text values so downstream logic stays consistent
    body.campus = campusData.name;
    body.grade = gradeData.name;
    body.section = sectionData.name;
  } else if (body.campus && body.grade && body.section) {
    // Fallback: validate using text values only (backward compatible path)
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

  // Persist ID columns when provided
  if (hasIds) {
    updates.campus_id = body.campusId;
    updates.grade_id = body.gradeId;
    updates.section_id = body.sectionId;
  }
  
  let query = supabaseClient
    .from("students")
    .update(updates)
    .eq("id", id);

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
