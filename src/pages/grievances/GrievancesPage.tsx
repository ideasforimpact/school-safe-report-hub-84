
import React from 'react';
import { MessageSquare, BarChart2, Share2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import GrievancesList from '@/components/grievances/GrievancesList';
import { GrievanceProvider } from '@/contexts/grievances/GrievanceContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const GrievancesPage = () => {
  const shareFormLink = () => {
    const shareUrl = `${window.location.origin}/grievances/submit`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Grievance Submission Form',
        text: 'Submit your grievance using this form',
        url: shareUrl,
      }).catch(error => {
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link copied!",
        description: "Form link copied to clipboard"
      });
    });
  };

  return (
    <Layout>
      <GrievanceProvider>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Grievances</h1>
                <p className="text-gray-500 text-sm">Manage and respond to grievances from students and staff</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={shareFormLink} variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>Share Form</span>
              </Button>
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link to="/grievances/dashboard">
                  <BarChart2 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium mb-4 text-left">Grievance Submissions</h2>
            <GrievancesList />
          </div>
        </div>
      </GrievanceProvider>
    </Layout>
  );
};

export default GrievancesPage;
