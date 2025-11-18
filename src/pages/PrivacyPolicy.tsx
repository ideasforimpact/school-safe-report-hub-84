import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
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

        <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Data Collection</h2>
            <p>
              The Platform collects basic user information, including names, contact details, 
              student records, and usage data, to provide school-related services and communication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Use of Data</h2>
            <p>Collected data is used to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>Facilitate communication between schools, students, and parents.</li>
              <li>Provide personalized learning experiences.</li>
              <li>Improve system performance and features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Data Sharing</h2>
            <p>User data is not sold or rented. Data may be shared only:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>With authorized school personnel.</li>
              <li>With third-party services strictly for educational purposes and under data protection agreements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p>
              Industry-standard security protocols are employed to protect user data. 
              However, no system can be completely secure, and users should use the Platform responsibly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. User Rights</h2>
            <p>Users have the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>Access their personal data.</li>
              <li>Request corrections or deletion.</li>
              <li>Withdraw consent for certain data uses.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking</h2>
            <p>
              The Platform may use cookies to enhance user experience and track usage patterns. 
              Users can manage cookie preferences via browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Contact</h2>
            <p>
              For questions or concerns related to the Terms or Privacy Policy, 
              please contact the platform administrator via the "Contact School module."
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

export default PrivacyPolicy;

