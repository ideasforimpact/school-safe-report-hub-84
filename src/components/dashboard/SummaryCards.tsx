
import React from 'react';
import OpenIncidentsCard from './summary-cards/OpenIncidentsCard';
import MonthlyIncidentsCard from './summary-cards/MonthlyIncidentsCard';
import CommonCategoryCard from './summary-cards/CommonCategoryCard';
import PeopleInvolvedCard from './summary-cards/PeopleInvolvedCard';

interface SummaryCardsProps {
  openIncidents: number;
  totalIncidents: number;
  incidentsThisMonth: number;
  mostCommonCategory: string;
  categoryCounts: Record<string, number>;
  totalPeopleInvolved: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  openIncidents,
  totalIncidents,
  incidentsThisMonth,
  mostCommonCategory,
  categoryCounts,
  totalPeopleInvolved
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <OpenIncidentsCard 
        openIncidents={openIncidents} 
        totalIncidents={totalIncidents} 
      />
      
      <MonthlyIncidentsCard 
        incidentsThisMonth={incidentsThisMonth} 
      />
      
      <CommonCategoryCard 
        mostCommonCategory={mostCommonCategory} 
        categoryCounts={categoryCounts} 
      />
      
      <PeopleInvolvedCard 
        totalPeopleInvolved={totalPeopleInvolved} 
      />
    </div>
  );
};

export default SummaryCards;
