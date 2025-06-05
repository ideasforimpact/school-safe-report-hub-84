
import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CaptchaVerificationProps {
  onVerificationSuccess: () => void;
  onBack?: () => void;
}

const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({
  onVerificationSuccess,
  onBack
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // You'll need to get this from Google reCAPTCHA console
  // For now, using a test key - replace with your actual site key
  const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Test key

  const handleCaptchaChange = (token: string | null) => {
    if (token) {
      setIsVerified(true);
      toast({
        title: "Verification Successful",
        description: "You can now proceed to the form.",
      });
    } else {
      setIsVerified(false);
    }
  };

  const handleCaptchaExpired = () => {
    setIsVerified(false);
    toast({
      title: "Verification Expired",
      description: "Please complete the CAPTCHA again.",
      variant: "destructive"
    });
  };

  const handleCaptchaError = () => {
    setIsVerified(false);
    toast({
      title: "Verification Error",
      description: "There was an error with the CAPTCHA. Please try again.",
      variant: "destructive"
    });
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
          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleCaptchaChange}
              onExpired={handleCaptchaExpired}
              onError={handleCaptchaError}
              theme="light"
            />
          </div>

          {!isVerified && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Please complete the CAPTCHA verification to proceed
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
            <p>This site is protected by reCAPTCHA and the Google</p>
            <p>
              <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
              <a href="https://policies.google.com/terms" className="text-blue-600 hover:underline">Terms of Service</a> apply.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaptchaVerification;
