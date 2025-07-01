
export const capitalizeClientName = (name: string | undefined): string => {
  if (!name) return 'Your School';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
