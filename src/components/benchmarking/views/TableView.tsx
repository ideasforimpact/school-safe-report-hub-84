
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';

interface TableViewProps {
  chartData: any[];
  showSubcategories: boolean;
  selectedCities: string[];
}

const TableView = ({ chartData, showSubcategories, selectedCities }: TableViewProps) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              {showSubcategories ? "Subcategory" : "City"}
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-500">Your School</TableHead>
            
            {showSubcategories ? (
              selectedCities.map(city => (
                <TableHead key={city} className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  {city}
                </TableHead>
              ))
            ) : (
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-500">City Average</TableHead>
            )}
            
            <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-500">Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {chartData.length > 0 ? (
            chartData.map((item, index) => {
              const yourSchool = item['Your School'] || 0;
              const comparison = showSubcategories 
                ? selectedCities.length > 0 
                  ? selectedCities.reduce((sum: number, city: string) => sum + (item[city] || 0), 0) / selectedCities.length 
                  : 0
                : item['City Average'] || 0;
                
              const difference = yourSchool - comparison;
              const isHigher = difference > 0;
              
              return (
                <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <TableCell className="px-4 py-3 text-sm font-medium">{item.name}</TableCell>
                  <TableCell className="px-4 py-3 text-sm">{yourSchool}</TableCell>
                  
                  {showSubcategories ? (
                    selectedCities.map(city => (
                      <TableCell key={city} className="px-4 py-3 text-sm">
                        {item[city] || 0}
                      </TableCell>
                    ))
                  ) : (
                    <TableCell className="px-4 py-3 text-sm">{comparison}</TableCell>
                  )}
                  
                  <TableCell className={`px-4 py-3 text-sm font-medium ${isHigher ? 'text-red-600' : 'text-green-600'}`}>
                    {difference === 0 ? 'Equal' : `${isHigher ? '+' : ''}${difference.toFixed(1)}`}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell className="px-4 py-3 text-sm text-gray-500 text-center" colSpan={4 + (showSubcategories ? selectedCities.length : 0)}>
                No data available for the selected category
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableView;
