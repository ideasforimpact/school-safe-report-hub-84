
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityIcon } from 'lucide-react';

interface CommonCategoryCardProps {
  mostCommonCategory: string;
  categoryCounts: Record<string, number>;
}

const CommonCategoryCard: React.FC<CommonCategoryCardProps> = ({ 
  mostCommonCategory, 
  categoryCounts 
}) => {
  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">Common Category</CardTitle>
          <div className="bg-purple-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <ActivityIcon className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </div>
        </div>
        <CardDescription>Most reported</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg md:text-xl font-semibold text-primary-700 truncate">{mostCommonCategory}</p>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs text-gray-500">
            {categoryCounts[mostCommonCategory] || 0} incidents reported
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommonCategoryCard;
