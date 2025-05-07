
import React from 'react';
import { MessageSquare, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import FormsList from '@/components/feedback/FormsList';
import FeedbackList from '@/components/feedback/FeedbackList';
import { FeedbackProvider } from '@/contexts/feedback/FeedbackContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FeedbackPage = () => {
  return (
    <Layout>
      <FeedbackProvider>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Feedback & Grievances</h1>
                <p className="text-gray-500 text-sm">Create, manage, and analyze feedback forms and grievances</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link to="/feedback/dashboard">
                  <BarChart2 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="forms" className="mt-8">
            <TabsList className="mb-6 bg-gray-100 p-1">
              <TabsTrigger value="forms" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Forms</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Submissions</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="forms" className="animate-fade-in">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-medium mb-4 text-left">Forms</h2>
                <FormsList />
              </div>
            </TabsContent>
            
            <TabsContent value="submissions" className="animate-fade-in">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-medium mb-4 text-left">Feedback Submissions</h2>
                <FeedbackList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </FeedbackProvider>
    </Layout>
  );
};

export default FeedbackPage;
