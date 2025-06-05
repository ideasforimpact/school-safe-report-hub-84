
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CaptchaVerificationProps {
  onVerificationSuccess: () => void;
  onBack?: () => void;
}

const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({
  onVerificationSuccess,
  onBack
}) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const generateCaptcha = () => {
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleVerify = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const correctAnswer = num1 + num2;
      const userAnswerNum = parseInt(userAnswer);

      if (userAnswerNum === correctAnswer) {
        toast({
          title: "Verification Successful",
          description: "You can now proceed to the form.",
        });
        onVerificationSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          toast({
            title: "Too Many Failed Attempts",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Incorrect Answer",
            description: `Please try again. ${3 - newAttempts} attempts remaining.`,
            variant: "destructive"
          });
          generateCaptcha();
        }
      }
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer && attempts < 3) {
      handleVerify();
    }
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
            Please solve the math problem below to continue
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Label className="text-lg font-medium mb-2 block">
              What is the sum of:
            </Label>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {num1} + {num2} = ?
            </div>
            <Input
              type="number"
              placeholder="Enter your answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-center text-lg"
              disabled={attempts >= 3 || isLoading}
            />
          </div>

          {attempts > 0 && attempts < 3 && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {3 - attempts} attempts remaining
              </span>
            </div>
          )}

          {attempts >= 3 && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Maximum attempts reached. Please refresh the page to try again.
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
              onClick={handleVerify}
              disabled={!userAnswer || attempts >= 3 || isLoading}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={generateCaptcha}
            className="w-full"
            disabled={attempts >= 3 || isLoading}
          >
            Generate New Problem
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaptchaVerification;
