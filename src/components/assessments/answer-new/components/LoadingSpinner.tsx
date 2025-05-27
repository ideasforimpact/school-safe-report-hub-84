
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <FileText className="h-12 w-12 text-blue-500" />
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin absolute -top-1 -right-1" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Assessment
              </h3>
              <p className="text-gray-600">
                Please wait while we prepare your assessment...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingSpinner;
