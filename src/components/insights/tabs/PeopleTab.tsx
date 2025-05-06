
import React from 'react';
import RoleDistributionChart from './charts/RoleDistributionChart';
import AssigneeChart from './charts/AssigneeChart';

interface PeopleTabProps {
  roleDistributionData: Array<{name: string, value: number}>;
  assigneeData: Array<{name: string, value: number}>;
  colors: string[];
}

const PeopleTab: React.FC<PeopleTabProps> = ({
  roleDistributionData,
  assigneeData,
  colors
}) => {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Role Distribution Chart */}
      <div className="chart-container">
        <RoleDistributionChart data={roleDistributionData} colors={colors} />
      </div>
      
      {/* Assignee Chart */}
      <div className="chart-container">
        <AssigneeChart data={assigneeData} colors={colors} />
      </div>
    </div>
  );
};

export default PeopleTab;
