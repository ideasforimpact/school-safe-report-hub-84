
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

export interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <main className="flex flex-col min-h-screen">
        {children}
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
