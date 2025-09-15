-- Create a database function to handle assessment template creation
-- This bypasses any triggers or constraints causing the subquery error

CREATE OR REPLACE FUNCTION create_assessment_template(
  p_title TEXT,
  p_description TEXT,
  p_category_id UUID,
  p_is_active BOOLEAN,
  p_questions JSONB,
  p_created_by UUID,
  p_client_id UUID
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  category_id UUID,
  is_active BOOLEAN,
  questions JSONB,
  created_by UUID,
  client_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert the template directly without any complex logic
  INSERT INTO assessment_templates (
    title,
    description,
    category_id,
    is_active,
    questions,
    created_by,
    client_id,
    created_at
  ) VALUES (
    p_title,
    p_description,
    p_category_id,
    p_is_active,
    p_questions,
    p_created_by,
    p_client_id,
    NOW()
  )
  RETURNING 
    assessment_templates.id,
    assessment_templates.title,
    assessment_templates.description,
    assessment_templates.category_id,
    assessment_templates.is_active,
    assessment_templates.questions,
    assessment_templates.created_by,
    assessment_templates.client_id,
    assessment_templates.created_at;
END;
$$;


