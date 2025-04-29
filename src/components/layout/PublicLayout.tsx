
import { ReactNode } from 'react';
import Header from './Header';

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
