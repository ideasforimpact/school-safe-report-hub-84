
import React from 'react';
import { AlertTriangle, List, ChartPie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActionButton from './actions/ActionButton';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: "Report New Incident",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      path: "/report"
    },
    {
      title: "View All Incidents",
      icon: List,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      path: "/incidents"
    },
    {
      title: "View Insights",
      icon: ChartPie,
      color: "text-green-600",
      bgColor: "bg-green-100",
      path: "/new-insights"
    }
  ];
  
  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-xl font-medium text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {actions.map((action, index) => (
          <ActionButton
            key={index}
            title={action.title}
            icon={action.icon}
            color={action.color}
            bgColor={action.bgColor}
            onClick={() => navigate(action.path)}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
