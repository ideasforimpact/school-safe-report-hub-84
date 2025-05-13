
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white shadow-sm rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
        <p className="text-gray-600 mb-6">
          Your grievance has been successfully submitted. We appreciate you taking the time to share your concerns.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-md p-4 text-blue-800 text-sm">
            <p>Our team will review your submission and contact you within 2-3 business days via your preferred contact method.</p>
          </div>
          
          <p className="text-gray-500 text-sm">
            Reference ID: GR-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
          </p>
        </div>
        
        <div className="mt-8">
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
