
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Truck, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const VehicleTabs = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Vehicle Documents</CardTitle>
        <CardDescription>
          View and manage vehicle documents, including registration certificates, insurance, and pollution papers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <Button 
            variant="outline" 
            className="flex items-center h-auto p-4 justify-between"
            onClick={() => navigate('/transport-safety/vehicles')}
          >
            <div className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-primary" />
              <span>View All Vehicles</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center h-auto p-4 justify-between"
            onClick={() => navigate('/transport-safety/documents')}
          >
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <span>Document Management</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleTabs;
