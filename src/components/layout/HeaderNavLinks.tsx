
import React from 'react';
import { Link } from 'react-router-dom';

const HeaderNavLinks = () => {
  return (
    <nav className="hidden md:flex items-center space-x-4">
      <Link to="/dashboard" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition-colors">
        Dashboard
      </Link>
      <Link to="/incidents" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition-colors">
        Incidents
      </Link>
      <Link to="/report-incident" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition-colors">
        Report Incident
      </Link>
      <Link to="/insights" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition-colors">
        Insights
      </Link>
    </nav>
  );
};

export default HeaderNavLinks;
