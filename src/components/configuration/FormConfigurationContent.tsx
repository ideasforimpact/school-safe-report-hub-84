import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SimpleFormBuilder from './SimpleFormBuilder';
import FormPreviewDialog from './FormPreviewDialog';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'attachment' | 'rating';
  label: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
  allowMultiple?: boolean;
  maxFiles?: number;
  allowedFileTypes?: string[];
}

interface CustomForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: string;
  submissions: number;
}

const FormConfigurationContent = () => {
  const [forms, setForms] = useState<CustomForm[]>([
    {
      id: '1',
      title: 'Student Feedback Form',
      description: 'Collect feedback from students about their learning experience',
      fields: [
        { id: '1', type: 'text', label: 'Student Name', required: true },
        { id: '2', type: 'select', label: 'Grade', required: true, options: ['9th', '10th', '11th', '12th'] },
        { id: '3', type: 'textarea', label: 'Feedback', required: true },
        { id: '4', type: 'rating', label: 'Overall Satisfaction', required: true, maxRating: 5 },
        { id: '5', type: 'attachment', label: 'Supporting Documents', required: false, allowMultiple: true, maxFiles: 3, allowedFileTypes: ['image/*', 'application/pdf'] }
      ],
      isActive: true,
      createdAt: '2024-01-15',
      submissions: 23
    },
    {
      id: '2',
      title: 'Teacher Evaluation',
      description: 'Annual teacher performance evaluation form',
      fields: [
        { id: '1', type: 'text', label: 'Teacher Name', required: true },
        { id: '2', type: 'radio', label: 'Performance Rating', required: true, options: ['Excellent', 'Good', 'Average', 'Needs Improvement'] },
        { id: '3', type: 'rating', label: 'Teaching Effectiveness', required: true, maxRating: 10 }
      ],
      isActive: false,
      createdAt: '2024-01-10',
      submissions: 8
    }
  ]);
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<CustomForm | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewForm, setPreviewForm] = useState<CustomForm | null>(null);

  const handleCreateForm = () => {
    setEditingForm(null);
    setShowBuilder(true);
  };

  const handleEditForm = (form: CustomForm) => {
    setEditingForm(form);
    setShowBuilder(true);
  };

  const handlePreviewForm = (form: CustomForm) => {
    setPreviewForm(form);
    setPreviewDialogOpen(true);
  };

  const handleSaveForm = (formData: Omit<CustomForm, 'id' | 'createdAt' | 'submissions'>) => {
    if (editingForm) {
      // Update existing form
      setForms(prev => prev.map(form => 
        form.id === editingForm.id 
          ? { ...form, ...formData }
          : form
      ));
    } else {
      // Create new form
      const newForm: CustomForm = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        submissions: 0
      };
      setForms(prev => [...prev, newForm]);
    }
    setShowBuilder(false);
    setEditingForm(null);
  };

  const handleDeleteClick = (form: CustomForm) => {
    setFormToDelete(form);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (formToDelete) {
      setForms(prev => prev.filter(form => form.id !== formToDelete.id));
      setFormToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = (form: CustomForm) => {
    setForms(prev => prev.map(f => 
      f.id === form.id ? { ...f, isActive: !f.isActive } : f
    ));
  };

  const getFieldTypesDisplay = (fields: FormField[]) => {
    const types = fields.map(field => {
      switch (field.type) {
        case 'attachment': return 'File';
        case 'rating': return 'Rating';
        case 'textarea': return 'Text Area';
        case 'select': return 'Dropdown';
        case 'radio': return 'Radio';
        case 'checkbox': return 'Checkbox';
        default: return 'Text';
      }
    });
    return [...new Set(types)].join(', ');
  };

  if (showBuilder) {
    return (
      <SimpleFormBuilder
        form={editingForm}
        onSave={handleSaveForm}
        onCancel={() => {
          setShowBuilder(false);
          setEditingForm(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Custom Forms</h3>
          <p className="text-sm text-gray-500">Create and manage custom forms for data collection</p>
        </div>
        <Button onClick={handleCreateForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No forms created yet</h3>
              <p className="text-gray-500 mb-6">Create your first custom form to start collecting data</p>
              <Button onClick={handleCreateForm}>Create Form</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Field Types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{form.description}</TableCell>
                    <TableCell>{form.fields.length} fields</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-600">
                      {getFieldTypesDisplay(form.fields)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{form.submissions}</TableCell>
                    <TableCell>{form.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewForm(form)}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(form)}
                          className="gap-1"
                        >
                          {form.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditForm(form)}
                          className="gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(form)}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{formToDelete?.title}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FormPreviewDialog 
        form={previewForm}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
      />
    </div>
  );
};

export default FormConfigurationContent;
