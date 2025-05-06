
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, CheckCircle, ClockIcon, BarChart } from 'lucide-react';

interface AssessmentSummaryCardsProps {
  data: {
    total: number;
    completed: number;
    pending: number;
    averageScore: number;
  };
}

const AssessmentSummaryCards: React.FC<AssessmentSummaryCardsProps> = ({ data }) => {
  const { total, completed, pending, averageScore } = data;
  
  // Define card data
  const summaryCards = [
    {
      title: 'Total Assessments',
      value: total,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Review',
      value: pending,
      icon: ClockIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Average Score',
      value: `${averageScore}%`,
      icon: BarChart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {summaryCards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card key={index} className="border-none shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl md:text-3xl font-semibold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.bgColor} h-12 w-12 rounded-full flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AssessmentSummaryCards;
