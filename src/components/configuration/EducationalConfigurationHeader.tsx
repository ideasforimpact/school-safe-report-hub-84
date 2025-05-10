
import React from 'react';

interface EducationalConfigurationHeaderProps {
  title: string;
  description: string;
}

export const EducationalConfigurationHeader: React.FC<EducationalConfigurationHeaderProps> = ({
  title,
  description
}) => {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-600 mt-1">
        {description}
      </p>
    </div>
  );
};
