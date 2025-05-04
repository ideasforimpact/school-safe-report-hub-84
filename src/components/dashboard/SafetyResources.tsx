
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, Phone } from 'lucide-react';

const SafetyResources: React.FC = () => {
  return (
    <Card className="border-none shadow-card">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-medium">Safety Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <div className="bg-blue-100 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center">
                <School className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm md:text-base">Emergency Procedures</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600">Review the latest emergency protocols and procedures</p>
          </div>
          
          <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <div className="bg-green-100 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm md:text-base">Training Materials</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600">Access staff training resources for incident response</p>
          </div>
          
          <div className="p-3 md:p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <div className="bg-amber-100 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm md:text-base">Contact Directory</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600">Important contacts for emergency situations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyResources;
