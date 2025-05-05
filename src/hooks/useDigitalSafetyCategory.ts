
import { useState, useEffect } from 'react';
import { ConfigItem } from '@/contexts/types';
import { toast } from '@/components/ui/sonner';

export function useDigitalSafetyCategory(
  categories: ConfigItem[],
  addCategory: (name: string) => ConfigItem | void
) {
  const [isAddingDigitalSafety, setIsAddingDigitalSafety] = useState(false);
  const [digitalSafetyAdded, setDigitalSafetyAdded] = useState(false);

  useEffect(() => {
    // Don't attempt to add Digital Safety if we're already trying to add it,
    // or if categories haven't loaded yet, or if we've already successfully added it
    if (isAddingDigitalSafety || categories.length === 0 || digitalSafetyAdded) {
      return;
    }
    
    // Check if Digital Safety already exists
    const digitalSafetyExists = categories.some(cat => 
      cat.name.toLowerCase() === 'digital safety'
    );
    
    console.log("Digital Safety exists:", digitalSafetyExists);
    
    // Only try to add if it doesn't exist
    if (!digitalSafetyExists) {
      setIsAddingDigitalSafety(true);
      
      try {
        // Call addCategory
        const result = addCategory('Digital Safety');
        console.log("Adding Digital Safety category result:", result);
        
        // Since we can't check if void is truthy, assume success if no error is thrown
        // The state update will happen via the categories prop changing
        setDigitalSafetyAdded(true);
        toast.success("Digital Safety category added successfully");
      } catch (error) {
        console.error("Error adding Digital Safety category:", error);
        // Only show error toast if it's not because the category already exists
        if (error instanceof Error && !error.message.includes("already exists")) {
          toast.error(`Failed to add Digital Safety category: ${error.message}`);
        } else {
          // If the error is because it already exists, mark it as added
          setDigitalSafetyAdded(true);
        }
      } finally {
        setIsAddingDigitalSafety(false);
      }
    } else {
      // Mark as added if it already exists
      setDigitalSafetyAdded(true);
    }
  }, [categories, addCategory, isAddingDigitalSafety, digitalSafetyAdded]);
  
  return {
    isAddingDigitalSafety,
    digitalSafetyAdded
  };
}
