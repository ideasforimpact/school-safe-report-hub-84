
export const FACTOR_CATEGORIES = [
  'Human Factors',
  'Environmental Factors',
  'Procedural Factors',
  'Equipment Factors',
  'Organizational Factors',
  'Other'
];

export const getWeightColor = (weight: string) => {
  switch (weight) {
    case 'Low':
      return 'bg-blue-100 text-blue-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'High':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
