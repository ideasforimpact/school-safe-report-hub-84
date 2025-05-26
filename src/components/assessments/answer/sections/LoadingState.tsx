
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const LoadingState = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading assessment...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingState;
