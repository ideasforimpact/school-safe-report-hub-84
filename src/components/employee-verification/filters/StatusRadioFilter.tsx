import React from 'react';

interface StatusRadioFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const StatusRadioFilter: React.FC<StatusRadioFilterProps> = ({ 
  value, 
  onChange 
}) => {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'failed', label: 'Failed' }
  ];

  return (
    <div className="flex gap-6">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="status"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary focus:ring-2"
          />
          <span className="text-sm font-medium text-foreground">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};

export default StatusRadioFilter;