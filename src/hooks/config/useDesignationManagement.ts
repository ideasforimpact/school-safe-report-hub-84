
import { useState } from 'react';
import { ConfigItem } from '@/contexts/types';

export function useDesignationManagement(initialDesignations: ConfigItem[] = []) {
  // Designations state
  const [designations, setDesignations] = useState<ConfigItem[]>(initialDesignations);

  // Designations management
  const addDesignation = (name: string) => {
    const newDesignation = {
      id: Date.now().toString(),
      name
    };
    setDesignations(prev => [...prev, newDesignation]);
  };

  const updateDesignation = (id: string, name: string) => {
    setDesignations(prev => prev.map(designation => 
      designation.id === id ? { ...designation, name } : designation
    ));
  };

  const deleteDesignation = (id: string) => {
    setDesignations(prev => prev.filter(designation => designation.id !== id));
  };

  return {
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation
  };
}
