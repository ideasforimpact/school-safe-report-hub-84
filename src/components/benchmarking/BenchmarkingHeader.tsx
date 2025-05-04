
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const BenchmarkingHeader = () => {
  return (
    <Card className="shadow-md border border-gray-100 bg-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Benchmarking</CardTitle>
        <CardDescription>Compare your incidents data with similar schools in your area</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Use the filters below to adjust your benchmarking view and gain valuable insights into how your 
          incident rates compare with schools of similar size and demographics.
        </p>
      </CardContent>
    </Card>
  );
};

export default BenchmarkingHeader;
