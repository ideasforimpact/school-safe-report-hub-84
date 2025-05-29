
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';

const ConnectSchoolSettings = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ConnectSchool Settings</h1>
          <p className="text-muted-foreground">
            Configure ConnectSchool system settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              ConnectSchool-specific settings and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              Settings panel will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ConnectSchoolSettings;
