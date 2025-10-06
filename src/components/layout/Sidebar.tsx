import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import SidebarContent from './sidebar/SidebarContent';

const Sidebar = () => {
  const { user } = useAuth();
  // We keep the state but won't provide UI to toggle it
  const [collapsed, setCollapsed] = useState(false);
  
  // Positioned at the very top with no padding-top
  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 bottom-0 bg-[#1e40af] transition-all duration-300 flex flex-col z-50 shadow-2xl border-r border-blue-800/30",
        collapsed ? "w-24" : "w-28" // slightly increased width for better readability
      )}
    >
      <SidebarContent />
      {/* Removed the collapse button */}
    </aside>
  );
};

export default Sidebar;
