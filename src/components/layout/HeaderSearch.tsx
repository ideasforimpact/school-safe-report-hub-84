
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const HeaderSearch = () => {
  return (
    <div className="hidden md:block max-w-md w-full mx-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search..."
          className="pl-10 bg-gray-50 border border-gray-200 focus:border-primary-500 w-full"
        />
      </div>
    </div>
  );
};

export default HeaderSearch;
