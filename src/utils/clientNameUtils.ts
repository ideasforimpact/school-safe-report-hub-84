
/**
 * Utility function to properly capitalize client names
 * Handles single words, possessive forms, and multi-word names
 * @param name - The client name to capitalize
 * @returns Properly capitalized client name
 */
export function capitalizeClientName(name: string | undefined): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      
      // Handle possessive forms (e.g., "yaane's" -> "Yaane's")
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts.map((part, index) => 
          index === 0 ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part.toLowerCase()
        ).join("'");
      }
      
      // Regular capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
