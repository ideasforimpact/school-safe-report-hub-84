-- Create custom_forms table
CREATE TABLE IF NOT EXISTS custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL, -- Store form fields configuration
  is_active BOOLEAN DEFAULT true,
  preview_url VARCHAR(500) UNIQUE, -- Generated URL for form access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES custom_forms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  submitter_phone VARCHAR(50),
  submitter_type VARCHAR(50), -- 'parent', 'student', 'staff', 'other'
  responses JSONB NOT NULL, -- Store form responses
  attachments JSONB, -- Store file attachments info
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'rejected'
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_forms_client_id ON custom_forms(client_id);
CREATE INDEX IF NOT EXISTS idx_custom_forms_preview_url ON custom_forms(preview_url);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);

-- Enable RLS
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_forms
CREATE POLICY "Users can view forms for their client" ON custom_forms
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM employees WHERE user_id = auth.uid() AND status = true
    )
  );

CREATE POLICY "SaaS owners can manage all forms" ON custom_forms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true 
      AND status = true
    )
  );

-- RLS Policies for form_submissions
CREATE POLICY "Users can view submissions for their client forms" ON form_submissions
  FOR SELECT USING (
    form_id IN (
      SELECT cf.id FROM custom_forms cf
      JOIN employees e ON cf.client_id = e.client_id
      WHERE e.user_id = auth.uid() AND e.status = true
    )
  );

CREATE POLICY "SaaS owners can manage all submissions" ON form_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true 
      AND status = true
    )
  );

-- Function to generate preview URL
CREATE OR REPLACE FUNCTION generate_form_preview_url()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.preview_url IS NULL THEN
    NEW.preview_url := 'form/' || gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate preview URL
CREATE TRIGGER set_form_preview_url
  BEFORE INSERT ON custom_forms
  FOR EACH ROW
  EXECUTE FUNCTION generate_form_preview_url(); 