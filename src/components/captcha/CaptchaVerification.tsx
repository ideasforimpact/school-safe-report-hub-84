
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

interface CaptchaVerificationProps {
  onVerificationSuccess: () => void;
  onBack?: () => void;
}

const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({
  onVerificationSuccess,
  onBack
}) => {
  const [captchaInput, setCaptchaInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load captcha engine on component mount
    loadCaptchaEnginge(6); // 6 characters
  }, []);

  const handleCaptchaValidation = () => {
    if (!captchaInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter the CAPTCHA text.",
        variant: "destructive"
      });
      return;
    }

    if (validateCaptcha(captchaInput)) {
      setIsVerified(true);
      toast({
        title: "Verification Successful",
        description: "CAPTCHA verified successfully. You can now proceed.",
      });
    } else {
      setIsVerified(false);
      setCaptchaInput('');
      toast({
        title: "Verification Failed",
        description: "CAPTCHA text is incorrect. Please try again.",
        variant: "destructive"
      });
      // Reload captcha
      loadCaptchaEnginge(6);
    }
  };

  const handleRefreshCaptcha = () => {
    loadCaptchaEnginge(6);
    setCaptchaInput('');
    setIsVerified(false);
  };

  const handleProceed = () => {
    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete the CAPTCHA verification first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Small delay to show loading state
    setTimeout(() => {
      onVerificationSuccess();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Security Verification</CardTitle>
          <p className="text-gray-600">
            Please complete the verification below to continue
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* CAPTCHA Canvas */}
            <div className="flex justify-center">
              <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <LoadCanvasTemplate />
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshCaptcha}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh CAPTCHA
              </Button>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <Label htmlFor="captcha-input">Enter the text shown above</Label>
              <Input
                id="captcha-input"
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter CAPTCHA text"
                className="text-center"
                disabled={isVerified}
              />
            </div>

            {/* Verify Button */}
            {!isVerified && (
              <Button
                onClick={handleCaptchaValidation}
                className="w-full"
                disabled={!captchaInput.trim()}
              >
                Verify CAPTCHA
              </Button>
            )}
          </div>

          {!isVerified && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Please complete the CAPTCHA verification to proceed
              </span>
            </div>
          )}

          {isVerified && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm">
                CAPTCHA verified successfully!
              </span>
            </div>
          )}

          <div className="flex gap-3">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleProceed}
              disabled={!isVerified || isLoading}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Proceed"}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>This verification helps protect against automated abuse.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaptchaVerification;
