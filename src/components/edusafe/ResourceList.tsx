
import React from 'react';
import { EduSafeResource } from '@/types/eduSafeTypes';
import ResourceCard from './ResourceCard';
import { AlertCircle } from 'lucide-react';

interface ResourceListProps {
  resources: EduSafeResource[];
  onViewResource: (resource: EduSafeResource) => void;
}

const ResourceList: React.FC<ResourceListProps> = ({ resources, onViewResource }) => {
  if (resources.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-gray-50">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-left text-center">No resources found</h3>
        <p className="mt-2 text-sm text-gray-500 text-center">
          No resources match your current filters or none have been added yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        <ResourceCard 
          key={resource.id} 
          resource={resource} 
          onView={onViewResource}
        />
      ))}
    </div>
  );
};

export default ResourceList;
