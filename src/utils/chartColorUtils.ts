
// Define our color palette for consistency across charts
export const CHART_COLORS = {
  // Main color palette
  purple: '#9b87f5',
  darkPurple: '#7E69AB',
  lightPurple: '#e5deff',
  blue: '#33C3F0',
  green: '#4ade80',
  yellow: '#facc15',
  orange: '#f97316',
  red: '#ef4444',
  
  // Status colors
  open: '#ef4444',
  inProgress: '#f97316',
  closed: '#4ade80',
  
  // Priority colors
  low: '#33C3F0',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
  
  // Chart sequence colors for consistent coloring
  sequence: [
    '#9b87f5', '#33C3F0', '#4ade80', '#facc15', 
    '#f97316', '#ef4444', '#7E69AB', '#D946EF'
  ]
};

// Helper function to get a color by category
export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Physical Injury': CHART_COLORS.red,
    'Bullying': CHART_COLORS.orange,
    'Tech Misuse': CHART_COLORS.blue,
    'Property Damage': CHART_COLORS.yellow,
    'Health Concern': CHART_COLORS.green,
    'Security Breach': CHART_COLORS.purple,
    'Other': CHART_COLORS.darkPurple
  };
  
  return colorMap[category] || CHART_COLORS.purple;
}

// Get color for incident type
export function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'Incident': CHART_COLORS.red,
    'Near Miss': CHART_COLORS.yellow,
    'Unsafe Condition': CHART_COLORS.blue
  };
  
  return colorMap[type] || CHART_COLORS.purple;
}

// Get color for status
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'Open': CHART_COLORS.open,
    'In Progress': CHART_COLORS.inProgress,
    'Closed': CHART_COLORS.closed
  };
  
  return colorMap[status] || CHART_COLORS.purple;
}

// Export the colors array for charts that need an array of colors
export const CHART_COLOR_ARRAY = CHART_COLORS.sequence;
