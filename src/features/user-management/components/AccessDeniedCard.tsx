
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const AccessDeniedCard = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p>You don't have permission to access this page.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessDeniedCard;
