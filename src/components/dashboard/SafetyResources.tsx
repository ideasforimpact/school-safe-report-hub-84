
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, Phone } from 'lucide-react';
import ResourceItem from './resources/ResourceItem';

const SafetyResources: React.FC = () => {
  const resources = [
    {
      title: "Emergency Procedures",
      description: "Review the latest emergency protocols and procedures",
      icon: School,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100"
    },
    {
      title: "Training Materials",
      description: "Access staff training resources for incident response",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100"
    },
    {
      title: "Contact Directory",
      description: "Important contacts for emergency situations",
      icon: Phone,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100"
    }
  ];

  return (
    <Card className="border-none shadow-card">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-medium">Safety Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {resources.map((resource, index) => (
            <ResourceItem 
              key={index}
              title={resource.title}
              description={resource.description}
              icon={resource.icon}
              color={resource.color}
              bgColor={resource.bgColor}
              borderColor={resource.borderColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyResources;
