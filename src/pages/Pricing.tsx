
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "@/components/layout/PublicLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "Standard",
    price: "$20",
    description: "Essential incident reporting for schools of all sizes",
    features: [
      "Unlimited incident reporting",
      "Basic analytics dashboard",
      "Email notifications",
      "10 user accounts",
      "1-year data retention",
      "Email support"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Comprehensive district-wide safety solution",
    features: [
      "Unlimited incident reporting",
      "Advanced analytics with forecasting",
      "Custom notification workflows",
      "Unlimited user accounts",
      "Unlimited data retention",
      "API access for integration",
      "Custom onboarding and training",
      "Dedicated account manager",
      "24/7 premium support"
    ],
    cta: "Contact Sales",
    popular: true
  }
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlanSelect = (planName: string) => {
    if (user) {
      console.log(`Selected plan: ${planName}`);
      // In a real app, this would navigate to checkout or show a subscription modal
    } else {
      navigate('/login');
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan to keep your school community safe with our comprehensive incident management system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`flex flex-col h-full ${plan.popular ? 'border-primary shadow-md relative' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.name !== "Enterprise" && <span className="text-gray-500"> /month</span>}
                  {plan.name === "Enterprise" && <span className="text-gray-500"> (Negotiable)</span>}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handlePlanSelect(plan.name)} 
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Need a custom solution?</h3>
          <p className="text-gray-600 mb-6">
            We offer tailored plans for large school districts and organizations with specific requirements
          </p>
          <Button variant="outline" size="lg">Contact Our Sales Team</Button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
