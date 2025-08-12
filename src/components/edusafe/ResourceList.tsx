
import React from 'react';
import { EduSafeResource } from '@/types/eduSafeTypes';
import ResourceCard from './ResourceCard';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEduSafe } from '@/contexts/edusafe/EduSafeContext';

interface ResourceListProps {
  resources: EduSafeResource[];
}

const ResourceList: React.FC<ResourceListProps> = ({ resources }) => {
  const { loading } = useEduSafe();

  if (loading) {
    return (
      <div className="text-center py-16 border rounded-lg bg-gray-50">
        <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
        <h3 className="mt-4 text-lg font-medium text-center">Loading resources...</h3>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Please wait while we fetch the resources.
        </p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-gray-50">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-center">No resources found</h3>
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
        />
      ))}
    </div>
  );
};

export default ResourceList;
