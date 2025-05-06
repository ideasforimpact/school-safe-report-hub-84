
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 max-w-4xl mx-auto">
      <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-4" />
      <p className="text-gray-600">Loading assessment...</p>
    </div>
  );
};

export default LoadingState;
