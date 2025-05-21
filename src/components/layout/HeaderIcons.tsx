
// If HeaderIcons.tsx doesn't exist or you need to create a link elsewhere,
// you can add the backoffice login link to another relevant component

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const HeaderIcons = () => {
  return (
    <div className="flex items-center space-x-4">
      {/* Add other header icons or components here */}
      
      <Link to="/backoffice/login">
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Shield size={16} />
          <span className="hidden md:inline">Admin</span>
        </Button>
      </Link>
    </div>
  );
};

export default HeaderIcons;
