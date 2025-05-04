
import React from 'react';
import { Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CityFilterProps {
  cityNames: string[];
  selectedCities: string[];
  toggleCity: (cityName: string) => void;
}

const CityFilter = ({ cityNames, selectedCities, toggleCity }: CityFilterProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        <Filter className="h-4 w-4 inline mr-1" />
        Select Cities to Compare
      </label>
      <div className="space-y-2 border rounded-md p-3">
        {cityNames.map(city => (
          <div key={city} className="flex items-center space-x-2">
            <Checkbox 
              id={`city-${city}`} 
              checked={selectedCities.includes(city)}
              onCheckedChange={() => toggleCity(city)}
            />
            <label htmlFor={`city-${city}`} className="text-sm">
              {city}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CityFilter;
