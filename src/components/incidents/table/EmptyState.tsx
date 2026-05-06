
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

interface EmptyStateProps {
  hasIncidents: boolean;
  hasFilteredIncidents: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  hasIncidents, 
  hasFilteredIncidents 
}) => {
  const navigate = useNavigate();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();

  if (!hasIncidents) {
    return (
      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="text-center py-12">
            <FileX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-3">No incidents found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              There are no incidents matching your current filters or no incidents have been reported yet.
            </p>
            <div className="flex justify-center gap-4">
              {!isReadOnlySwitchedContext && (
                <Button onClick={() => navigate('/report-incident')}>
                  Report New Incident
                </Button>
              )}
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasIncidents && !hasFilteredIncidents) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
        <p className="text-amber-800">Filtering applied. No matching incidents found.</p>
        <Button variant="ghost" className="ml-auto" onClick={() => window.location.reload()}>
          Reset Filters
        </Button>
      </div>
    );
  }

  return null;
};
