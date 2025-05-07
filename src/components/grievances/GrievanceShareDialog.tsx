
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GrievanceShareDialogProps {
  formId: string;
  onClose: () => void;
}

const GrievanceShareDialog: React.FC<GrievanceShareDialogProps> = ({ formId, onClose }) => {
  const { forms } = useGrievance();
  const [copied, setCopied] = useState(false);
  
  const form = forms.find(f => f.id === formId);
  
  if (!form) return null;
  
  // Generate a shareable URL for the form
  const shareableUrl = `${window.location.origin}/grievances/form/${formId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl).then(() => {
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "The grievance form link has been copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Grievance Form</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-500">
            Share this link for anyone to submit a grievance using this form.
            No login is required to access and submit the form.
          </p>
          
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={shareableUrl}
              className="flex-1"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button 
              size="icon" 
              onClick={handleCopyLink} 
              className={copied ? "bg-green-600" : undefined}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-1">Form Details</h3>
            <p className="text-sm"><strong>Title:</strong> {form.title}</p>
            <p className="text-sm"><strong>Questions:</strong> {form.questions.length}</p>
            <p className="text-sm"><strong>Status:</strong> {form.isActive ? 'Active' : 'Inactive'}</p>
            
            {!form.isActive && (
              <p className="text-sm text-red-500 mt-2">
                Note: This form is currently inactive. Anyone using this link will not be able to submit responses.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GrievanceShareDialog;
