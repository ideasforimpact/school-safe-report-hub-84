import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuestionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  fileData: string; // base64 encoded file data
}

interface AssessmentQuestion {
  id: string;
  text: string;
  allowComments: boolean;
  allowAttachments: boolean;
  required: boolean;
  files?: QuestionFile[];
}

interface CreateTemplateRequest {
  title: string;
  description: string;
  type: string;
  isActive: boolean;
  questions: AssessmentQuestion[];
  clientId: string;
  employeeId: string;
  templateId?: string; // For updates
}

// Sanitize filename for storage (from questionFileService)
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '_')
    .replace(/[—–]/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/[_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Generate file path for question files (from questionFileService)
function generateFilePath(
  clientId: string,
  employeeId: string,
  assessmentName: string,
  questionNumber: number,
  fileName: string
): string {
  const sanitizedAssessmentName = assessmentName.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${clientId}/${employeeId}/${sanitizedAssessmentName}/question_${questionNumber}/${fileName}`;
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Upload file to Supabase storage (from questionFileService logic)
async function uploadFileToStorage(
  supabaseClient: any,
  file: QuestionFile,
  filePath: string
): Promise<{ url: string; path: string }> {
  // Allowed file types: PDF, DOC, DOCX, PNG, JPEG, JPG
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpeg', '.jpg'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Validate file
  if (file.size === 0) {
    throw new Error(`File ${file.name} is empty`);
  }

  // Validate file size (10MB limit)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File ${file.name} exceeds the 10MB size limit. Maximum file size is 10MB.`);
  }

  // Validate file type
  const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || 
    ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!isValidType) {
    throw new Error(`File ${file.name} has an invalid format. Allowed formats: PDF, DOC, DOCX, PNG, JPEG, JPG.`);
  }

  // Convert base64 to Uint8Array
  console.log('File object in uploadFileToStorage:', file);
  console.log('File.fileData type:', typeof file.fileData);
  console.log('File.fileData value:', file.fileData);
  
  if (!file.fileData || typeof file.fileData !== 'string') {
    throw new Error(`File ${file.name} does not have valid fileData`);
  }
  
  const fileBytes = base64ToUint8Array(file.fileData);

  // Upload to Supabase storage
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('assessment-question-files')
    .upload(filePath, fileBytes, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from('assessment-question-files')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const { title, description, type, isActive, questions, clientId, employeeId, templateId }: CreateTemplateRequest = await req.json()

    const isUpdate = !!templateId;
    console.log(`${isUpdate ? 'Updating' : 'Creating'} template with files:`, { 
      templateId, 
      title, 
      type, 
      questionCount: questions.length 
    });

    // Validate required fields
    if (!title || !type || !questions || !clientId || !employeeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get category_id from template_categories table based on type
    const { data: categoryData, error: categoryError } = await supabaseClient
      .from('template_categories')
      .select('id')
      .eq('name', type)
      .single();

    if (categoryError) {
      console.error('Category lookup error:', categoryError);
      return new Response(
        JSON.stringify({ error: `Template category '${type}' not found` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const categoryId = categoryData.id;

    // For updates, get existing template to preserve existing files
    let existingQuestions: AssessmentQuestion[] = [];
    if (isUpdate) {
      console.log('Fetching existing template for update:', templateId);
      const { data: existingTemplate, error: fetchError } = await supabaseClient
        .from('assessment_templates')
        .select('questions')
        .eq('id', templateId)
        .single()

      if (fetchError) {
        console.error('Error fetching existing template:', fetchError);
        return new Response(
          JSON.stringify({ error: `Failed to fetch existing template: ${fetchError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      existingQuestions = existingTemplate.questions || [];
      console.log('Existing questions from database:', existingQuestions);
    }

    // Process questions and handle file uploads
    const processedQuestions: AssessmentQuestion[] = []
    
    console.log('Processing questions:', {
      questionsCount: questions.length,
      questions: questions
    });
    
    // Debug: Log each question's files
    questions.forEach((q, index) => {
      console.log(`Question ${index + 1} (${q.id}):`, {
        text: q.text,
        filesCount: q.files?.length || 0,
        files: q.files
      });
    });

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const questionNumber = i + 1
      
      console.log(`Processing question ${questionNumber}: ${question.text}`)

      // Find existing question to preserve existing files
      const existingQuestion = existingQuestions.find(eq => eq.id === question.id)
      // Keep all existing files - they should already be valid if they're in the database
      const existingFiles = existingQuestion?.files || []
      
      console.log(`Question ${questionNumber} - existing files:`, existingFiles);
      console.log(`Question ${questionNumber} - incoming files:`, question.files);

      const processedQuestion: AssessmentQuestion = {
        id: question.id,
        text: question.text,
        allowComments: question.allowComments,
        allowAttachments: question.allowAttachments,
        required: question.required,
        files: [...existingFiles] // Start with valid existing files
      }

      // Handle files for this question
      if (question.files && question.files.length > 0) {
        console.log(`Processing ${question.files.length} files for question ${questionNumber}`)
        console.log(`Question files from frontend:`, question.files)
        
        // Ensure only one file per question (safeguard)
        if (question.files.length > 1) {
          console.log(`Warning: Question ${questionNumber} has ${question.files.length} files, but only one file per question is allowed. Taking the first file.`);
          question.files = [question.files[0]];
        }
        
        const uploadedFiles = []

        for (const file of question.files) {
          try {
            console.log('Processing file in loop:', file);
            console.log('File has fileData:', !!file.fileData);
            console.log('File has file property:', !!(file as any).file);
            
            // If file has fileData, it's a new file - upload it
            if (file.fileData) {
              // Generate unique file name
              const timestamp = Date.now()
              const randomSuffix = Math.random().toString(36).substring(2, 8)
              const sanitizedFileName = sanitizeFileName(file.name)
              const uniqueFileName = `${timestamp}_${randomSuffix}_${sanitizedFileName}`
              const filePath = generateFilePath(
                clientId,
                employeeId,
                title,
                questionNumber,
                uniqueFileName
              )

              console.log(`Uploading new file: ${file.name} to path: ${filePath}`)

              // Upload file to storage
              const { url, path } = await uploadFileToStorage(supabaseClient, file, filePath);

              const uploadedFile = {
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                url: url,
                path: path,
                uploadedAt: new Date().toISOString()
              }

              uploadedFiles.push(uploadedFile)
              console.log(`Successfully uploaded new file: ${file.name}`)
            } else if ((file as any).url && (file as any).path) {
              // File has URL and path - it's an existing file, keep it
              console.log(`Preserving existing file: ${file.name}`)
              uploadedFiles.push({
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                url: (file as any).url,
                path: (file as any).path,
                uploadedAt: (file as any).uploadedAt || new Date().toISOString()
              })
            } else {
              // File without fileData, URL, or path - might be invalid
              console.log(`Skipping invalid file: ${file.name}`)
            }

          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error)
            throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }

        // For updates: If there are new files, completely replace existing files
        // For creates: Use the uploaded files
        if (isUpdate) {
          console.log(`Update mode: Replacing existing files with ${uploadedFiles.length} new files for question ${questionNumber}`)
          
          // Delete old files from storage if they exist
          if (existingFiles.length > 0) {
            console.log(`Deleting ${existingFiles.length} old files from storage for question ${questionNumber}`)
            for (const oldFile of existingFiles) {
              try {
                if ((oldFile as any).path) {
                  const { error: deleteError } = await supabaseClient.storage
                    .from('assessment-question-files')
                    .remove([(oldFile as any).path])
                  
                  if (deleteError) {
                    console.error(`Error deleting old file ${oldFile.name}:`, deleteError)
                  } else {
                    console.log(`Successfully deleted old file: ${oldFile.name}`)
                  }
                }
              } catch (error) {
                console.error(`Error deleting old file ${oldFile.name}:`, error)
              }
            }
          }
          
          processedQuestion.files = uploadedFiles
        } else {
          console.log(`Create mode: Using ${uploadedFiles.length} uploaded files for question ${questionNumber}`)
          processedQuestion.files = uploadedFiles
        }
      } else {
        // No new files, just preserve existing ones
        console.log(`No new files for question ${questionNumber}, preserving ${existingFiles.length} existing files`)
      }

      // Log final files count
      console.log(`Final files for question ${questionNumber}: ${(processedQuestion.files || []).length}`)

      processedQuestions.push(processedQuestion)
    }

    console.log('Final processed questions:', {
      processedQuestionsCount: processedQuestions.length,
      processedQuestions: processedQuestions
    });
    
    // Debug: Log each processed question's files
    processedQuestions.forEach((q, index) => {
      console.log(`Processed Question ${index + 1} (${q.id}):`, {
        text: q.text,
        filesCount: q.files?.length || 0,
        files: q.files
      });
    });

    // Create or update template in database
    let templateData;
    let templateError;

    if (isUpdate) {
      // Update existing template
      const { data, error } = await supabaseClient
        .from('assessment_templates')
        .update({
          title,
          description,
          category_id: categoryId,
          is_active: isActive,
          questions: processedQuestions,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()

      templateData = data?.[0];
      templateError = error;
    } else {
      // Create new template
      console.log('Creating template with data:', {
        title,
        description,
        category_id: categoryId,
        is_active: isActive,
        questions: processedQuestions,
        created_by: employeeId,
        client_id: clientId
      });

      const { data, error } = await supabaseClient
        .from('assessment_templates')
        .insert({
          title,
          description,
          category_id: categoryId,
          is_active: isActive,
          questions: processedQuestions,
          created_by: employeeId,
          client_id: clientId
        })
        .select()

      console.log('Template creation result:', {
        error: error,
        data: data,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint
      });
        
      templateData = data?.[0];
      templateError = error;
    }

    if (templateError) {
      console.error('Template operation error:', templateError);
      return new Response(
        JSON.stringify({ error: `Failed to ${isUpdate ? 'update' : 'create'} template: ${templateError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Template ${isUpdate ? 'updated' : 'created'} successfully:`, templateData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        templateId: templateData.id,
        message: `Template ${isUpdate ? 'updated' : 'created'} successfully with all files processed`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-assessment-template:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
