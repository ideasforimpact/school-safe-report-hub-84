
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, School } from 'lucide-react';

const HomeHero = () => {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2 mb-10 md:mb-0">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Protect What Matters Most
        </h2>
        <p className="text-xl text-gray-700 mb-8">
          One incident is all it takes to risk your school's reputation and student safety.
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary mb-8">
          <p className="text-lg">
            Our all-in-one <span className="font-semibold">Incident & Safety Management System</span> empowers schools to:
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Report issues in seconds</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Track trends and risky behavior</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Take timely action — before it's too late</span>
            </li>
          </ul>
        </div>
        <p className="text-lg text-primary-800 font-medium mb-6">
          Be proactive. Stay prepared. Create a safer campus, every day.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg"
            onClick={() => navigate('/login')}
            className="px-8 bg-primary hover:bg-primary/80 transition-all"
          >
            Start Reporting Today
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/login')}
            className="transition-all hover:bg-primary hover:text-white"
          >
            Watch Demo
          </Button>
        </div>
      </div>
      <div className="md:w-1/2 md:pl-10">
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-full h-full bg-primary/10 rounded-lg"></div>
          <div className="relative bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="flex justify-center mb-4">
              <School className="h-16 w-16 text-primary" />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mb-4 flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="font-bold">Protected Campus</h3>
                <p className="text-sm">Early intervention system active</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">Incidents Prevented</p>
                <p className="text-xl font-bold text-primary">94%</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">Safety Rating</p>
                <p className="text-xl font-bold text-green-600">A+</p>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="text-center text-sm font-medium text-primary">
                Your school could be this safe
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
