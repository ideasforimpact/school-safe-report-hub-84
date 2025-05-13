
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FormErrorProps {
  error: string | null;
}

const FormError = ({ error }: FormErrorProps) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start">
      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
      <p className="text-sm">{error}</p>
    </div>
  );
};

export default FormError;
