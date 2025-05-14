
import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground mt-2">{message}</p>
    </div>
  );
};

export default Loading;
