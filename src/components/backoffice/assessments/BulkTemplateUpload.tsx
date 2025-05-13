
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';

const BulkTemplateUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createTemplate } = useAssessment();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadSuccess(false);
    }
  };

  const validateTemplateData = (data: any) => {
    // Basic validation for templates
    if (!Array.isArray(data)) {
      return { valid: false, message: 'Uploaded file must contain an array of templates' };
    }
    
    for (let i = 0; i < data.length; i++) {
      const template = data[i];
      if (!template.title || !template.description || !template.questions || !Array.isArray(template.questions)) {
        return { 
          valid: false, 
          message: `Template at index ${i} is missing required fields: title, description, or questions array` 
        };
      }
      
      // Validate questions
      for (let j = 0; j < template.questions.length; j++) {
        const question = template.questions[j];
        if (!question.text || !question.type) {
          return {
            valid: false,
            message: `Question at index ${j} in template at index ${i} is missing required fields: text or type`
          };
        }
      }
    }
    
    return { valid: true, message: '' };
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const content = await file.text();
      let templates;
      
      // Try to parse the file content
      try {
        templates = JSON.parse(content);
      } catch (error) {
        throw new Error('Invalid JSON format. Please check your file.');
      }
      
      // Validate the template data
      const validation = validateTemplateData(templates);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      // Process each template
      for (const template of templates) {
        createTemplate({
          title: template.title,
          description: template.description,
          type: template.type || 'standard',
          questions: template.questions
        });
      }
      
      setUploadSuccess(true);
      toast.success(`Successfully imported ${templates.length} templates`);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast.error('Failed to import templates');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <Upload className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Upload Template Files</h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Upload JSON files containing assessment template definitions. 
          Each file should contain an array of template objects.
        </p>
        
        <Input 
          type="file" 
          className="max-w-xs" 
          accept=".json" 
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <div className="mt-4 flex gap-4">
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Templates'}
          </Button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span className="text-sm">Templates successfully imported</span>
          </div>
        )}
      </div>
      
      <Card className="p-4">
        <h4 className="font-medium mb-2">Template JSON Format Example:</h4>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
{`[
  {
    "title": "School Safety Assessment",
    "description": "A comprehensive assessment of school safety measures",
    "type": "standard",
    "questions": [
      {
        "text": "Are entry points secured during school hours?",
        "type": "yes_no",
        "required": true,
        "order": 1
      },
      {
        "text": "Rate the effectiveness of your current emergency response plan",
        "type": "rating",
        "required": true,
        "order": 2
      }
    ]
  }
]`}
        </pre>
      </Card>
    </div>
  );
};

export default BulkTemplateUpload;
