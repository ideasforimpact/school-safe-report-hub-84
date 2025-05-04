
import { ReactNode } from 'react';
import Header from './Header';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto py-4 px-0">
          <div className="flex items-center">
            <Link to="/home" className="flex items-center">
              <ShieldCheck className="h-7 w-7 text-primary ml-0" />
              <h1 className="text-2xl font-bold text-primary ml-2">Safe School</h1>
            </Link>
          </div>
        </div>
      </div>
      <Header />
      <main className="px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
