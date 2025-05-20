
import React from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

interface ReduxDebuggerProps {
  show?: boolean;
}

const ReduxDebugger: React.FC<ReduxDebuggerProps> = ({ show = false }) => {
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  if (!show) return null;
  
  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-md text-xs">
      <h3 className="font-bold mb-2">Redux Store Debug</h3>
      <div className="overflow-auto max-h-96">
        <pre>{JSON.stringify(state, null, 2)}</pre>
        <div className="mt-2 border-t pt-2">
          <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
          <p><strong>Is Super Admin:</strong> {isSuperAdmin ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default ReduxDebugger;
