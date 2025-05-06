
import React, { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface CategoryTagsProps {
  currentData: Array<{name: string, value: number}>;
  colors: string[];
  originalData: Array<{name: string, value: number}>;
  total: number;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

const CategoryTags: React.FC<CategoryTagsProps> = ({ 
  currentData, 
  colors, 
  originalData, 
  total,
  activeIndex,
  setActiveIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<typeof currentData>([]);
  
  // Update visible items when current data changes
  useEffect(() => {
    if (!containerRef.current || currentData.length === 0) {
      setVisibleItems(currentData);
      return;
    }
    
    // Load all items without virtual rendering since we're using pagination now
    setVisibleItems(currentData);
    
  }, [currentData]);
  
  return (
    <div className="w-full md:w-2/3 pl-0 md:pl-6 flex flex-col">
      <div 
        ref={containerRef} 
        className="flex flex-wrap gap-2"
      >
        {visibleItems.map((item, index) => {
          const originalIndex = originalData.findIndex(d => d.name === item.name);
          const percentage = ((item.value / total) * 100).toFixed(1);
          const color = colors[originalIndex % colors.length];
          const isActive = activeIndex === originalIndex;
          
          return (
            <Badge
              key={`tag-${item.name}-${index}`}
              className={`
                category-tag flex items-center gap-1.5 py-1.5 px-3 transition-all duration-200 cursor-pointer
                mb-2 max-w-full
                ${isActive ? 'ring-2 ring-offset-1' : 'hover:ring-1 hover:ring-offset-1'}
              `}
              style={{ 
                backgroundColor: `${color}15`, 
                color: color,
                borderColor: color,
              }}
              variant="outline"
              onMouseEnter={() => setActiveIndex(originalIndex)}
              onMouseLeave={() => setActiveIndex(null)}
              data-index={index}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="font-medium truncate max-w-[120px]" title={item.name}>{item.name}</span>
              <span className="px-1.5 py-0.5 bg-white/80 rounded-full text-xs font-medium whitespace-nowrap">
                {item.value}
              </span>
              <span className="text-xs opacity-80 whitespace-nowrap">
                {percentage}%
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTags;
