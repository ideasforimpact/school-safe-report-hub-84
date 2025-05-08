
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  const navigate = useNavigate();
  
  return (
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
  );
};

export default CTASection;
