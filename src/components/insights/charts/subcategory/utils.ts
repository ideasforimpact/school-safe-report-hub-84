
/**
 * Utility functions for the subcategory chart
 */

// Generate color gradient based on value and position
export const getBarColor = (index: number, colors: string[]): string => {
  const baseColor = colors[0] || '#8884d8'; // Default to purple
  
  // Calculate opacity based on position in sorted array
  const opacity = 0.4 + (0.6 * (1 - (index / 10)));
  
  // For hex colors, convert to RGB to add opacity
  if (baseColor.startsWith('#')) {
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return baseColor;
};

// Process chart data to sort and limit to top 10
export const processChartData = (data: Array<{name: string, value: number}>) => {
  return [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(item => ({
      ...item,
      formattedValue: item.value // Store original value for label
    }));
};

// Calculate total for percentages
export const calculateTotal = (data: Array<{name: string, value: number}>) => {
  return data.reduce((sum, item) => sum + item.value, 0);
};
