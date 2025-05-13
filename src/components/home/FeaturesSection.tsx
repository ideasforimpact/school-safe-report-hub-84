
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Users, ChartPie } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Why Safe School?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-l-4 border-l-blue-500 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Early Intervention</h3>
              <p className="text-gray-600">
                Identify and address potential safety concerns before they escalate into serious incidents.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaborative Response</h3>
              <p className="text-gray-600">
                Engage all stakeholders in the incident management process with clear action items.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ChartPie className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Data-Driven Insights</h3>
              <p className="text-gray-600">
                Make informed decisions with comprehensive analytics and reporting tools.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
