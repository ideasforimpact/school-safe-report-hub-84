
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const IncidentConfigurationContent = () => {
  const navigate = useNavigate();
  
  // Instead of displaying a link, load the actual configuration component's content
  React.useEffect(() => {
    // Redirect to the incident configuration page
    navigate('/incident-configuration');
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500">Loading incident configuration...</p>
      </div>
    </div>
  );
};

export default IncidentConfigurationContent;
