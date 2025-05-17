
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import NewsSection from '@/components/home/NewsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';
import Footer from '@/components/home/Footer';
import { newsAndAnnouncements } from '@/components/home/newsData';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Home = () => {
  const { user, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is logged in as SaaS owner, redirect them to dashboard
    if (user && isSaasOwner) {
      navigate('/dashboard');
    }
  }, [user, isSaasOwner, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <HomeNavbar showBackoffice={isSaasOwner} hideSignIn={!!user} />
      <HomeHero />
      <NewsSection newsItems={newsAndAnnouncements} />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
