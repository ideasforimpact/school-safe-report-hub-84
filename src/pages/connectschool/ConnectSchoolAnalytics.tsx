
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';

const ConnectSchoolAnalytics = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ConnectSchool Analytics</h1>
          <p className="text-muted-foreground">
            Analytics and insights for ConnectSchool programs
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Program Performance</CardTitle>
            <CardDescription>
              Key metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              Analytics dashboard will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ConnectSchoolAnalytics;
