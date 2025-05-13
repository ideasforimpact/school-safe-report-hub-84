
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AssessmentTabsProps {
  children: React.ReactNode;
  defaultValue?: string;
}

const AssessmentTabs: React.FC<AssessmentTabsProps> = ({ children, defaultValue }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on the URL path
  const getActiveTab = () => {
    if (location.pathname.includes('/templates')) return 'templates';
    if (location.pathname.includes('/assignments')) return 'assignments';
    if (location.pathname.includes('/results')) return 'results';
    if (location.pathname.includes('/respond')) return 'assignments'; // This ensures respond still shows assignments tab as active
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(defaultValue || getActiveTab());
  
  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    switch(value) {
      case 'templates':
        navigate('/assessments/templates');
        break;
      case 'assignments':
        navigate('/assessments/assignments');
        break;
      case 'results':
        navigate('/assessments/results');
        break;
      default:
        navigate('/assessments');
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-4 max-w-md mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};

export default AssessmentTabs;
