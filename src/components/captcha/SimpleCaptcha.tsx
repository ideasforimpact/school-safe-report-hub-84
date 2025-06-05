
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
  isSubmitting?: boolean;
}

const SimpleCaptcha: React.FC<SimpleCaptchaProps> = ({ onVerify, isSubmitting = false }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsVerified(false);
    onVerify(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleVerify = () => {
    const isValid = userInput.toLowerCase() === captchaText.toLowerCase();
    setIsVerified(isValid);
    onVerify(isValid);
    
    if (!isValid) {
      generateCaptcha();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    if (isVerified) {
      setIsVerified(false);
      onVerify(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Please verify you're human
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="bg-white border-2 border-gray-300 rounded px-4 py-2 font-mono text-lg tracking-wider select-none bg-gradient-to-r from-gray-100 to-white">
          <span style={{
            background: 'linear-gradient(45deg, #333, #666, #333)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            letterSpacing: '2px'
          }}>
            {captchaText}
          </span>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateCaptcha}
          disabled={isSubmitting}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Enter the text above"
          value={userInput}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className={isVerified ? 'border-green-500' : ''}
        />
        
        <Button
          type="button"
          onClick={handleVerify}
          disabled={userInput.length === 0 || isSubmitting}
          variant={isVerified ? "default" : "outline"}
          className={isVerified ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {isVerified ? 'Verified ✓' : 'Verify'}
        </Button>
      </div>

      {isVerified && (
        <div className="text-sm text-green-600 flex items-center">
          ✓ CAPTCHA verified successfully
        </div>
      )}
    </div>
  );
};

export default SimpleCaptcha;
