
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Users, 
  ClipboardList, 
  AlertCircle, 
  Calendar, 
  CalendarDays,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

interface DashboardStatsCardsProps {
  stats: {
    openIncidents: {
      count: number;
      list: any[];
    };
    verificationStatus: {
      pending: number;
      total: number;
      percentage: number;
    };
    totalAssessments: {
      count: number;
      list: any[];
    };
    openCriticalIncidents: {
      count: number;
      list: any[];
    };
    todayIncidents: {
      count: number;
      list: any[];
    };
    weekIncidents: {
      count: number;
      list: any[];
    };
  } | null;
  loading: boolean;
}

const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: 'Open Incidents',
      value: stats.openIncidents.count,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: `${stats.openIncidents.count} incidents need attention`
    },
    {
      title: 'Verification Status',
      value: `${stats.verificationStatus.pending}/${stats.verificationStatus.total}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: `${stats.verificationStatus.percentage}% pending verification`,
      badge: stats.verificationStatus.pending > 0 ? 'Pending' : 'Complete'
    },
    {
      title: 'Total Assessments',
      value: stats.totalAssessments.count,
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: `${stats.totalAssessments.count} assessments created`
    },
    {
      title: 'Critical Incidents',
      value: stats.openCriticalIncidents.count,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: `${stats.openCriticalIncidents.count} critical incidents open`
    },
    {
      title: 'Today',
      value: stats.todayIncidents.count,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: `${stats.todayIncidents.count} incidents created today`
    },
    {
      title: 'This Week',
      value: stats.weekIncidents.count,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: `${stats.weekIncidents.count} incidents this week`
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{card.value}</div>
                {card.badge && (
                  <Badge 
                    variant={card.badge === 'Pending' ? 'destructive' : 'default'}
                    className="ml-2"
                  >
                    {card.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStatsCards;
