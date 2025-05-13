
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ShieldCheck, Users, ChartPie, CheckCircle, School, Home as HomeIcon, FileText, CreditCard, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <ShieldCheck className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-primary">Safe School</h1>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-6">
              <Link 
                to="/" 
                className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
              >
                <HomeIcon className="h-4 w-4 mr-1" />
                Home
              </Link>
              <Link 
                to="/blog" 
                className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
              >
                <FileText className="h-4 w-4 mr-1" />
                Blog
              </Link>
              <Link 
                to="/pricing" 
                className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Pricing
              </Link>
              <Link 
                to="/support" 
                className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Support
              </Link>
              <Link 
                to="/backoffice" 
                className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
              >
                <Users className="h-4 w-4 mr-1" />
                Backoffice
              </Link>
              <div className="ml-0 md:ml-4 mt-4 md:mt-0 w-full md:w-auto flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/login')}
                  className="transition-all hover:bg-primary hover:text-white"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-primary hover:bg-primary/80 transition-all"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
                <ShieldCheck className="h-8 w-8 text-green-600 mr-3" />
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

      {/* Features Section */}
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

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/90 to-primary py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Secure Your School?</h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Don't wait for incidents to happen. Implement a proactive safety management system today.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/login')}
            className="px-8 transition-all hover:shadow-lg"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <ShieldCheck className="h-6 w-6 text-primary-foreground mr-2" />
                <h3 className="text-xl font-bold text-white">Safe School</h3>
              </div>
              <p className="mt-2 max-w-xs">
                Comprehensive incident management system for educational institutions.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Use Cases</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} Safe School. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
