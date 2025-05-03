
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RootCauseDisplayProps {
  rootCause?: string;
}

const RootCauseDisplay: React.FC<RootCauseDisplayProps> = ({
  rootCause
}) => {
  if (!rootCause) return null;
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Root Cause Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{rootCause}</p>
      </CardContent>
    </Card>
  );
};

export default RootCauseDisplay;
