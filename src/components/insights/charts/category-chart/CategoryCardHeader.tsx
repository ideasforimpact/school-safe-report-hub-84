
import React from 'react';
import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CategoryCardHeaderProps {
  title: string;
  description?: string;
  total: number;
}

const CategoryCardHeader: React.FC<CategoryCardHeaderProps> = ({ title, description, total }) => {
  return (
    <CardHeader className="bg-white/40 backdrop-blur-sm border-b border-gray-50">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <CardTitle className="text-xl">{title}</CardTitle>
        <Badge variant="outline" className="ml-2 bg-gray-50">
          {total} incidents
        </Badge>
      </div>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  );
};

export default CategoryCardHeader;
