/**
 * Utility functions for YouTube URL handling and preview generation
 */

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url - YouTube URL
 * @returns YouTube video ID or null if invalid
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) {
    console.log('YouTube URL is empty or null');
    return null;
  }
  
  console.log('Extracting YouTube video ID from URL:', url);
  
  // Regular YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (watchMatch) {
    console.log('Found video ID via watch URL:', watchMatch[1]);
    return watchMatch[1];
  }
  
  // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
  if (embedMatch) {
    console.log('Found video ID via embed URL:', embedMatch[1]);
    return embedMatch[1];
  }
  
  // YouTube short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^&\n?#]+)/);
  if (shortMatch) {
    console.log('Found video ID via short URL:', shortMatch[1]);
    return shortMatch[1];
  }
  
  // Additional pattern for URLs with additional parameters
  const paramMatch = url.match(/[?&]v=([^&\n?#]+)/);
  if (paramMatch) {
    console.log('Found video ID via parameter match:', paramMatch[1]);
    return paramMatch[1];
  }
  
  console.log('No video ID found in URL:', url);
  return null;
};

/**
 * Generates YouTube thumbnail URL
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality ('default', 'medium', 'high', 'standard', 'maxres')
 * @returns Thumbnail URL
 */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'
): string => {
  const qualityToFile: Record<string, string> = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    standard: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg',
  };

  const file = qualityToFile[quality] ?? qualityToFile.medium;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${file}`;
  console.log('Generated YouTube thumbnail URL:', thumbnailUrl);
  return thumbnailUrl;
};

/**
 * Generates YouTube embed URL
 * @param videoId - YouTube video ID
 * @returns Embed URL
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Validates if a URL is a valid YouTube URL
 * @param url - URL to validate
 * @returns true if valid YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return extractYouTubeVideoId(url) !== null;
};

/**
 * Gets YouTube video title from URL (requires API call in real implementation)
 * For now, returns a placeholder
 * @param videoId - YouTube video ID
 * @returns Promise<string> - Video title
 */
export const getYouTubeVideoTitle = async (videoId: string): Promise<string> => {
  // In a real implementation, you would call YouTube API here
  // For now, return a placeholder
  return `YouTube Video (${videoId})`;
};
