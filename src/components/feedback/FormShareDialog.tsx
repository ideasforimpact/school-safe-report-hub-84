
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Check, Copy, Link, Share2 } from 'lucide-react';
import { useFeedback } from '@/contexts/feedback/FeedbackContext';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface FormShareDialogProps {
  formId: string;
  onClose: () => void;
}

const FormShareDialog: React.FC<FormShareDialogProps> = ({ formId, onClose }) => {
  const { forms } = useFeedback();
  const form = forms.find(f => f.id === formId);
  
  const [copied, setCopied] = useState(false);
  const [requireAuth, setRequireAuth] = useState(false);
  
  const shareUrl = `${window.location.origin}/feedback/respond/${formId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Link Copied",
      description: "Form link has been copied to clipboard"
    });
  };

  if (!form) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Form
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <h3 className="text-base font-medium mb-1">{form.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{form.description}</p>
          </div>
          
          <div className="space-y-3">
            <Label>Form URL</Label>
            <div className="flex">
              <Input 
                readOnly 
                value={shareUrl} 
                className="flex-1 rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0" 
              />
              <Button 
                onClick={handleCopyLink} 
                variant="outline" 
                className="rounded-l-none border-l-0 px-3" 
                type="button"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this link with people to collect feedback or grievances
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="auth-required" 
              checked={requireAuth}
              onCheckedChange={setRequireAuth} 
            />
            <Label htmlFor="auth-required">Require authentication</Label>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button className="w-full flex gap-2">
              <Link className="h-4 w-4" />
              Share via Email
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormShareDialog;
