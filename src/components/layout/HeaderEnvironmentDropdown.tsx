
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Building, School } from 'lucide-react';

const HeaderEnvironmentDropdown = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current environment based on route
  const isConnectSchool = location.pathname.startsWith('/connectschool');
  const currentEnvironment = isConnectSchool ? 'connectSchool' : 'backoffice';
  
  const environments = [
    {
      key: 'backoffice',
      label: 'Backoffice',
      icon: Building,
      path: '/backoffice'
    },
    {
      key: 'connectSchool',
      label: 'ConnectSchool Backoffice',
      icon: School,
      path: '/connectschool'
    }
  ];

  const handleEnvironmentSwitch = (envPath: string) => {
    // Get the current sub-route (everything after /backoffice or /connectschool)
    const currentSubRoute = location.pathname.replace(/^\/(backoffice|connectschool)/, '') || '/dashboard';
    navigate(`${envPath}${currentSubRoute}`);
  };

  const currentEnv = environments.find(env => env.key === currentEnvironment);
  const CurrentIcon = currentEnv?.icon || Building;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          {currentEnv?.label}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {environments.map((env) => {
          const Icon = env.icon;
          return (
            <DropdownMenuItem
              key={env.key}
              onClick={() => handleEnvironmentSwitch(env.path)}
              className={`flex items-center gap-2 cursor-pointer ${
                currentEnvironment === env.key ? 'bg-accent' : ''
              }`}
            >
              <Icon className="h-4 w-4" />
              {env.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderEnvironmentDropdown;
