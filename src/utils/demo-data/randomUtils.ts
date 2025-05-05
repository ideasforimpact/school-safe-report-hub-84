
// Helper function to get a random item from an array
export const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get random items from an array
export const getRandomItems = <T,>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate a random date within the past year with more school-year weighting
export const generateRandomDate = (): Date => {
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  // Define periods with weights
  const periods = [
    { start: 0, end: 30, weight: 3 },         // Last month (3x more likely)
    { start: 31, end: 90, weight: 2 },        // 1-3 months ago (2x more likely)
    { start: 91, end: 180, weight: 1 },       // 3-6 months ago (normal)
    { start: 181, end: 270, weight: 1 },      // 6-9 months ago (normal)
    { start: 271, end: 365, weight: 0.5 }     // 9-12 months ago (half as likely)
  ];
  
  // Create weighted array of days
  let weightedDays: number[] = [];
  for (const period of periods) {
    for (let day = period.start; day <= period.end; day++) {
      // Add the day multiple times based on weight
      for (let w = 0; w < period.weight * 10; w++) {
        weightedDays.push(day);
      }
    }
  }
  
  // Select a random day from the weighted array
  const selectedDay = getRandomItem(weightedDays);
  
  // Create the date by subtracting the selected number of days
  const date = new Date();
  date.setDate(date.getDate() - selectedDay);
  
  // Adjust time to a reasonable hour during the school day (8am-3pm)
  date.setHours(8 + Math.floor(Math.random() * 7), 
                Math.floor(Math.random() * 60), 
                Math.floor(Math.random() * 60));
  
  return date;
};

// Generate ticket ID - using the index to ensure unique IDs from 1 to 100
export const generateTicketId = (index: number): string => {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(3, '0');
  return `SR-${year}-${paddedIndex}`;
};

