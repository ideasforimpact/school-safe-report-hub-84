
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface PeopleInvolvedCardProps {
  totalPeopleInvolved: number;
}

const PeopleInvolvedCard: React.FC<PeopleInvolvedCardProps> = ({ totalPeopleInvolved }) => {
  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">People Involved</CardTitle>
          <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </div>
        </div>
        <CardDescription>Total affected</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-semibold text-primary-700">
          {totalPeopleInvolved}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs text-gray-500">
            Across all incidents
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeopleInvolvedCard;
