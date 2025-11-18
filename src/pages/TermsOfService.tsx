import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we came from login page
  const fromLogin = location.state?.fromLogin || false;
  const originalRoute = location.state?.originalRoute;

  const handleBack = () => {
    if (fromLogin) {
      navigate('/login');
    } else if (originalRoute) {
      navigate(originalRoute);
    } else {
      // If no state, try to go back in history, otherwise go to home
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold text-center mb-8">Terms and Conditions</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p>
              These terms govern your access and use of the Safe School platform. 
              By using the Platform, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
            <p>
              The Platform is intended for use by students, parents, teachers, and school administrators. 
              By using the Platform, you represent that you have the legal authority to accept these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Provide accurate information during registration and profile updates.</li>
              <li>Maintain the confidentiality of login credentials.</li>
              <li>Use the Platform only for its intended educational and communication purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Acceptable Use</h2>
            <p className="mb-2">Users shall not:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Post or transmit any offensive, harmful, or illegal content.</li>
              <li>Attempt unauthorized access to any part of the Platform.</li>
              <li>Interfere with the Platform's operations or security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Content Ownership</h2>
            <p>
              All content shared on the Platform, including text, media, and files, remains the property 
              of the respective owners. By uploading content, users grant the Platform a limited license 
              to display and share it within the school community.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Modifications</h2>
            <p>
              The Platform reserves the right to update these Terms at any time. Users will be notified 
              of significant changes and continued use will imply acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Termination</h2>
            <p>
              Violation of these Terms may result in suspension or termination of account access 
              without prior notice.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">Effective Date: June 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

