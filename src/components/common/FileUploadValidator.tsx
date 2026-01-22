import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface FileUploadValidatorProps {
  errors?: string[];
  warnings?: string[];

  errorTitle?: string;
  warningTitle?: string;

  warningFooterText?: string;
  maxVisibleItems?: number;
}

const FileUploadValidator: React.FC<FileUploadValidatorProps> = ({
  errors = [],
  warnings = [],
  errorTitle = 'Validation Errors',
  warningTitle = 'Warnings',
  warningFooterText,
  maxVisibleItems = 10,
}) => {
  if (!errors.length && !warnings.length) return null;

  return (
    <div className="space-y-3">
      {/* ❌ ERRORS */}
      {errors.length > 0 && (
        <div className="border border-red-300 bg-red-50 rounded-md p-3 max-h-48 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm font-medium text-red-700">
              {errorTitle} ({errors.length})
            </p>
          </div>

          <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
            {errors.slice(0, maxVisibleItems).map((error, index) => (
              <li key={index}>{error}</li>
            ))}

            {errors.length > maxVisibleItems && (
              <li className="font-medium">
                ... and {errors.length - maxVisibleItems} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ⚠️ WARNINGS */}
      {warnings.length > 0 && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-md p-3 max-h-40 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-700">
              {warningTitle} ({warnings.length})
            </p>
          </div>

          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
            {warnings.slice(0, maxVisibleItems).map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}

            {warnings.length > maxVisibleItems && (
              <li className="font-medium">
                ... and {warnings.length - maxVisibleItems} more
              </li>
            )}
          </ul>

          {warningFooterText && (
            <p className="text-xs text-yellow-700 mt-2">
              {warningFooterText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadValidator;
