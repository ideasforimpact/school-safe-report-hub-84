
import React from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';

const IncidentFormHeader: React.FC = () => {
  return (
    <>
      <CardTitle>Report an Incident</CardTitle>
      <CardDescription>
        Fill out the form below to report an incident, near miss, or unsafe condition.
      </CardDescription>
    </>
  );
};

export default IncidentFormHeader;
