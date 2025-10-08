
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceCategory } from '@/types/eduSafeTypes';

interface CategoryFilterProps {
  selectedCategory: ResourceCategory | 'all';
  onSelectCategory: (category: ResourceCategory | 'all') => void;
}

const categories: Array<ResourceCategory | 'all'> = ['all', 'posters', 'policy', 'guidelines', 'forms', 'other'];

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <Tabs 
      value={selectedCategory} 
      onValueChange={(value) => onSelectCategory(value as ResourceCategory | 'all')}
      className="w-full"
    >
      <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
        {categories.map((category) => (
          <TabsTrigger 
            key={category} 
            value={category}
            className="capitalize"
          >
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default CategoryFilter;
