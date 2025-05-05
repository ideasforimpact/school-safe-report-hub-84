
import { useState, useMemo } from 'react';
import { useIncidents, IncidentCategory } from '@/contexts/IncidentContext';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';

// Mock city-level benchmarking data
const cityData = {
  'Central City': {
    'Physical Injury': {
      'Falls': 42,
      'Sports Injuries': 38,
      'Playground Accidents': 31,
      'Classroom Accidents': 24,
      'Other Physical Injuries': 18
    },
    'Behavioral Incident': {
      'Bullying': 27,
      'Fighting': 22,
      'Vandalism': 15,
      'Disruptive Behavior': 34,
      'Other Behavioral Issues': 12
    },
    'Health Emergency': {
      'Allergic Reaction': 16,
      'Asthma Attack': 19,
      'Seizure': 8,
      'Illness': 29,
      'Other Health Emergencies': 11
    },
    'Security Event': {
      'Unauthorized Access': 7,
      'Theft': 14,
      'Trespassing': 6,
      'Suspicious Activity': 11,
      'Other Security Events': 5
    }
  },
  'West District': {
    'Physical Injury': {
      'Falls': 38,
      'Sports Injuries': 45,
      'Playground Accidents': 28,
      'Classroom Accidents': 19,
      'Other Physical Injuries': 15
    },
    'Behavioral Incident': {
      'Bullying': 24,
      'Fighting': 18,
      'Vandalism': 12,
      'Disruptive Behavior': 30,
      'Other Behavioral Issues': 10
    },
    'Health Emergency': {
      'Allergic Reaction': 14,
      'Asthma Attack': 17,
      'Seizure': 6,
      'Illness': 25,
      'Other Health Emergencies': 9
    },
    'Security Event': {
      'Unauthorized Access': 5,
      'Theft': 11,
      'Trespassing': 4,
      'Suspicious Activity': 9,
      'Other Security Events': 3
    }
  },
  'East County': {
    'Physical Injury': {
      'Falls': 46,
      'Sports Injuries': 35,
      'Playground Accidents': 33,
      'Classroom Accidents': 28,
      'Other Physical Injuries': 21
    },
    'Behavioral Incident': {
      'Bullying': 30,
      'Fighting': 25,
      'Vandalism': 18,
      'Disruptive Behavior': 38,
      'Other Behavioral Issues': 15
    },
    'Health Emergency': {
      'Allergic Reaction': 19,
      'Asthma Attack': 22,
      'Seizure': 10,
      'Illness': 32,
      'Other Health Emergencies': 13
    },
    'Security Event': {
      'Unauthorized Access': 9,
      'Theft': 16,
      'Trespassing': 8,
      'Suspicious Activity': 13,
      'Other Security Events': 7
    }
  }
};

export const useBenchmarkingData = () => {
  const { incidents } = useIncidents();
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | ''>('Physical Injury');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Central City']);
  const [showSubcategories, setShowSubcategories] = useState(false);
  // Add date range state with default of last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  // Available categories and city names
  const categories = Object.keys(cityData['Central City']);
  const cityNames = Object.keys(cityData);
  
  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      // Remove if already selected
      setSelectedCities(selectedCities.filter(city => city !== cityName));
    } else {
      // Add if not selected
      setSelectedCities([...selectedCities, cityName]);
    }
  };
  
  const chartData = useMemo(() => {
    if (!selectedCategory) return [];
    
    // Filter incidents by date range if it exists
    const filteredIncidents = incidents.filter(incident => {
      if (!dateRange?.from) return true;
      
      const incidentDate = new Date(incident.date);
      if (dateRange.to) {
        return incidentDate >= dateRange.from && incidentDate <= dateRange.to;
      }
      return incidentDate >= dateRange.from;
    });

    if (showSubcategories) {
      // Show detailed subcategory breakdown
      const subcategories = selectedCategory ? 
        Object.keys(cityData['Central City'][selectedCategory as keyof typeof cityData['Central City']] || {}) : 
        [];
      
      return subcategories.map(subcategory => {
        const dataItem: Record<string, any> = { name: subcategory };
        
        // Add school data - filtered by date range
        const schoolCount = filteredIncidents
          .filter(incident => incident.category === selectedCategory && incident.subcategory === subcategory)
          .length;
        dataItem['Your School'] = schoolCount;
        
        // Add each selected city's data
        selectedCities.forEach(city => {
          if (cityData[city as keyof typeof cityData]) {
            const cityCategory = cityData[city as keyof typeof cityData][selectedCategory as keyof typeof cityData['Central City']];
            if (cityCategory) {
              dataItem[city] = cityCategory[subcategory as keyof typeof cityCategory] || 0;
            } else {
              dataItem[city] = 0;
            }
          }
        });
        
        return dataItem;
      });
    } else {
      // Show aggregate category-level data
      return selectedCities.map(city => {
        const cityData_local = cityData[city as keyof typeof cityData];
        const cityCategory = cityData_local ? cityData_local[selectedCategory as keyof typeof cityData_local] : undefined;
        
        const totalCityIncidents = cityCategory 
          ? Object.values(cityCategory).reduce((a: number, b: number) => a + b, 0) 
          : 0;
        
        // Count school incidents for this category - filtered by date range
        const schoolCategoryCount = filteredIncidents
          .filter(incident => incident.category === selectedCategory)
          .length;
        
        return {
          name: city,
          'City Average': totalCityIncidents,
          'Your School': schoolCategoryCount
        };
      });
    }
  }, [incidents, selectedCategory, selectedCities, showSubcategories, dateRange]);

  return {
    selectedCategory,
    setSelectedCategory: (category: IncidentCategory | string) => setSelectedCategory(category as IncidentCategory),
    selectedCities,
    setSelectedCities,
    showSubcategories,
    setShowSubcategories,
    dateRange,
    setDateRange,
    categories,
    cityNames,
    toggleCity,
    chartData
  };
};

export { cityData };
