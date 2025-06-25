
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
import { useEffect, useRef } from 'react';

const Home = () => {
  const { user, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);
  
  useEffect(() => {
    // If user is logged in as SaaS owner, redirect them to dashboard
    if (user && isSaasOwner && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigate('/dashboard');
    }
  }, [user, isSaasOwner, navigate]);

  const handleBackofficeClick = () => {
    // Check if user is authenticated and has access to backoffice
    if (user && (isSaasOwner || user.role === 'saas_owner')) {
      navigate('/backoffice/dashboard');
    } else {
      navigate('/backoffice/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <HomeNavbar 
        showBackoffice={true} 
        hideSignIn={!!user} 
        onBackofficeClick={handleBackofficeClick}
      />
      <HomeHero />
      <NewsSection newsItems={newsAndAnnouncements} />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
