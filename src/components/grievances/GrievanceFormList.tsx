
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import GrievanceFormBuilder from './GrievanceFormBuilder';
import GrievanceShareDialog from './GrievanceShareDialog';
import { Badge } from '@/components/ui/badge';

const GrievanceFormList = () => {
  const { forms } = useGrievance();
  const [isCreating, setIsCreating] = useState(false);
  const [editingForm, setEditingForm] = useState<string | null>(null);
  const [sharingForm, setSharingForm] = useState<string | null>(null);
  
  const handleCreateForm = () => {
    setIsCreating(true);
  };

  const handleCloseBuilder = () => {
    setIsCreating(false);
    setEditingForm(null);
  };

  const handleEditForm = (formId: string) => {
    setEditingForm(formId);
  };

  const handleShareForm = (formId: string) => {
    setSharingForm(formId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Grievance Forms</h2>
        <Button onClick={handleCreateForm} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Create Form</span>
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="flex justify-center mb-4">
            <MessageSquare className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Forms Created Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Create your first grievance form to start collecting responses.
          </p>
          <Button onClick={handleCreateForm}>
            Create Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="mr-2">{form.title}</CardTitle>
                  <Badge variant={form.isActive ? "default" : "outline"}>
                    {form.isActive ? "Active" : "Draft"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {form.questions.length} {form.questions.length === 1 ? 'question' : 'questions'}
                </p>
                <p className="text-sm text-gray-500">
                  {form.submissions} {form.submissions === 1 ? 'submission' : 'submissions'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleEditForm(form.id)}>
                  Edit
                </Button>
                <Button size="sm" onClick={() => handleShareForm(form.id)} className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Form Builder Dialog */}
      {(isCreating || editingForm) && (
        <GrievanceFormBuilder 
          formId={editingForm} 
          onClose={handleCloseBuilder} 
        />
      )}

      {/* Share Form Dialog */}
      {sharingForm && (
        <GrievanceShareDialog 
          formId={sharingForm} 
          onClose={() => setSharingForm(null)} 
        />
      )}
    </div>
  );
};

export default GrievanceFormList;
