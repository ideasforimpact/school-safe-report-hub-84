
// Utility functions for CAPTCHA verification
export const isCaptchaVerified = (): boolean => {
  const verified = sessionStorage.getItem('captcha_verified');
  const timestamp = sessionStorage.getItem('captcha_timestamp');
  
  if (!verified || !timestamp) {
    return false;
  }
  
  // Check if verification is still valid (expires after 30 minutes)
  const verificationTime = parseInt(timestamp);
  const currentTime = Date.now();
  const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  if (currentTime - verificationTime > thirtyMinutes) {
    // Clear expired verification
    clearCaptchaVerification();
    return false;
  }
  
  return true;
};

export const clearCaptchaVerification = (): void => {
  sessionStorage.removeItem('captcha_verified');
  sessionStorage.removeItem('captcha_timestamp');
};

export const requireCaptchaVerification = (formId?: string, type: 'form' | 'grievance' = 'form'): string => {
  const params = new URLSearchParams();
  params.set('type', type);
  
  if (formId) {
    return `/captcha-verification/${formId}?${params.toString()}`;
  } else {
    return `/captcha-verification?${params.toString()}`;
  }
};
