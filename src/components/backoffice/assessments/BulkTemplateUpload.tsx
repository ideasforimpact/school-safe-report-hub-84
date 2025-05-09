
import React, { useState } from 'react';
import { FileUp, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { toast } from 'sonner';
import { AssessmentTemplate } from '@/types/assessment';

const BulkTemplateUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const { templates, createTemplate, updateTemplate } = useAssessment();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadComplete(false);
      setValidationErrors([]);
    }
  };

  const validateTemplates = (templates: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    templates.forEach((template, index) => {
      if (!template.title) {
        errors.push(`Template ${index + 1}: Missing title`);
      }
      
      if (!template.description) {
        errors.push(`Template ${index + 1}: Missing description`);
      }
      
      if (!template.type) {
        errors.push(`Template ${index + 1}: Missing type`);
      }
      
      if (!Array.isArray(template.questions)) {
        errors.push(`Template ${index + 1}: Questions should be an array`);
      } else {
        template.questions.forEach((question: any, qIndex: number) => {
          if (!question.text) {
            errors.push(`Template ${index + 1}, Question ${qIndex + 1}: Missing question text`);
          }
        });
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  const importTemplates = async (templatesData: Partial<AssessmentTemplate>[]) => {
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const template of templatesData) {
      const existingTemplate = templates.find(t => t.title === template.title && t.type === template.type);
      
      if (existingTemplate) {
        updateTemplate(existingTemplate.id, template);
        updatedCount++;
      } else if (template.title && template.description && template.type) {
        createTemplate({
          title: template.title,
          description: template.description,
          type: template.type,
        });
        importedCount++;
      }
    }
    
    return { importedCount, updatedCount };
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const fileContent = await file.text();
      let templatesData: any[];
      
      if (file.name.endsWith('.json')) {
        templatesData = JSON.parse(fileContent);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing logic (in a real app, use a CSV parsing library)
        const rows = fileContent.split('\n');
        const headers = rows[0].split(',');
        
        templatesData = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          
          const values = rows[i].split(',');
          const template: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            template[header.trim()] = values[index]?.trim();
          });
          
          templatesData.push(template);
        }
      } else {
        throw new Error('Unsupported file format. Please upload JSON or CSV files.');
      }
      
      // Validate templates
      const { valid, errors } = validateTemplates(templatesData);
      
      if (!valid) {
        setValidationErrors(errors);
        setShowValidationDialog(true);
        return;
      }
      
      // Import templates
      const { importedCount, updatedCount } = await importTemplates(templatesData);
      
      toast.success(`Import complete: ${importedCount} templates created, ${updatedCount} templates updated.`);
      setUploadComplete(true);
      
    } catch (error) {
      toast.error(`Error processing file: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const downloadSampleTemplate = () => {
    const sampleTemplate = [
      {
        "title": "Safety Inspection Template",
        "description": "A template for conducting safety inspections in educational institutions",
        "type": "Safety",
        "questions": [
          {
            "text": "Are all emergency exits clear of obstructions?",
            "allowComments": true,
            "allowAttachments": true,
            "required": true
          },
          {
            "text": "Are fire extinguishers properly maintained and accessible?",
            "allowComments": true,
            "allowAttachments": true,
            "required": true
          }
        ]
      }
    ];
    
    const blob = new Blob([JSON.stringify(sampleTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader>
          <CardTitle className="text-center">Upload Templates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="bg-gray-50 rounded-full p-4 mb-4">
            <FileUp className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-center text-gray-500 mb-4">
            {file ? file.name : 'Drag and drop or click to upload a JSON or CSV file'}
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".json,.csv"
            className="hidden"
            id="template-file"
          />
          <label htmlFor="template-file">
            <Button variant="outline" className="cursor-pointer">
              Choose file
            </Button>
          </label>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={downloadSampleTemplate}>
            Download Sample
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload and Import"}
          </Button>
        </CardFooter>
      </Card>

      {uploadComplete && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <span>Templates successfully imported.</span>
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-medium mb-2">Instructions</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Upload a JSON or CSV file with template definitions</li>
          <li>Each template must include title, description, type and questions</li>
          <li>Questions should include text, allowComments, allowAttachments and required fields</li>
          <li>Templates with the same title and type will be updated if they already exist</li>
        </ul>
      </div>

      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Validation Errors
            </DialogTitle>
            <DialogDescription>
              The following errors were found in the uploaded templates:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((error, i) => (
                <li key={i} className="text-red-600">{error}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowValidationDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkTemplateUpload;
