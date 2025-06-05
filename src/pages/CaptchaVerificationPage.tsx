
import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CaptchaVerification from '@/components/captcha/CaptchaVerification';

const CaptchaVerificationPage = () => {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type'); // 'form' or 'grievance'

  const handleVerificationSuccess = () => {
    // Store verification status in sessionStorage
    sessionStorage.setItem('captcha_verified', 'true');
    sessionStorage.setItem('captcha_timestamp', Date.now().toString());

    // Navigate to the appropriate page based on type
    if (type === 'grievance') {
      navigate('/public-grievance-form');
    } else if (formId) {
      navigate(`/public-form/${formId}`);
    } else {
      navigate('/');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <CaptchaVerification
      onVerificationSuccess={handleVerificationSuccess}
      onBack={handleBack}
    />
  );
};

export default CaptchaVerificationPage;
