import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopContributors } from '@/hooks/useNewInsightsData';
import { User, UserCheck } from 'lucide-react';

interface TopContributorsListProps {
  title: string;
  description: string;
  data: TopContributors;
}

const TopContributorsList: React.FC<TopContributorsListProps> = ({ title, description, data }) => {
  if (data.contributors.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No contributor data available</p>
        </CardContent>
      </Card>
    );
  }

  const reporters = data.contributors.filter(c => c.type === 'reporter');
  const assignees = data.contributors.filter(c => c.type === 'assignee');

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top Reporters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Top Reporters</h4>
            </div>
            <div className="space-y-2">
              {reporters.map((reporter, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">{reporter.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {reporter.count} reports
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Top Assignees */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-4 w-4 text-green-600" />
              <h4 className="font-medium">Top Assignees</h4>
            </div>
            <div className="space-y-2">
              {assignees.map((assignee, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">{assignee.name}</span>
                  </div>
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    {assignee.count} assigned
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopContributorsList;