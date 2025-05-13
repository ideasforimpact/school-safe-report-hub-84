
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

interface ShareOptionsProps {
  formUrl: string;
  onBack?: () => void;
}

const ShareOptions = ({ formUrl, onBack }: ShareOptionsProps) => {
  const [showQRCode, setShowQRCode] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Form link copied to clipboard"
      });
    });
  };

  const shareViaNavigator = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Grievance Submission Form',
        text: 'Submit your grievance using this form',
        url: formUrl,
      }).catch(() => {
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="self-start flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to grievances</span>
        </Button>
      )}
      
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          <span>Copy Link</span>
        </Button>
        
        <Button onClick={shareViaNavigator} variant="outline" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Form QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <QRCodeSVG value={formUrl} size={200} />
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Scan this QR code to access the grievance form
              </p>
              <Button onClick={copyToClipboard} variant="outline" className="mt-4 w-full">
                Copy Form Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ShareOptions;
