
import { ShieldCheck } from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import NewsSection from '@/components/home/NewsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';
import Footer from '@/components/home/Footer';
import { newsAndAnnouncements } from '@/components/home/newsData';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <HomeNavbar />
      <HomeHero />
      <NewsSection newsItems={newsAndAnnouncements} />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
