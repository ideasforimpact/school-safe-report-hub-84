
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";

interface InsightsFiltersProps {
  dateFilter: string;
  setDateFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  subcategoryFilter: string;
  setSubcategoryFilter: (value: string) => void;
  facilityFilter: string;
  setFacilityFilter: (value: string) => void;
  personFilter: string;
  setPersonFilter: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  dateRange: DateRange | undefined;
  handleDateRangeChange: (range: DateRange | undefined) => void;
  availableSubcategories: string[];
  peopleInvolved: string[]; // Update type to string[] to ensure only strings are passed
  facilities: any[];
  isAdmin: boolean;
}

const InsightsFilters: React.FC<InsightsFiltersProps> = ({
  dateFilter,
  setDateFilter,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  subcategoryFilter,
  setSubcategoryFilter,
  facilityFilter,
  setFacilityFilter,
  personFilter,
  setPersonFilter,
  roleFilter,
  setRoleFilter,
  dateRange,
  handleDateRangeChange,
  availableSubcategories,
  peopleInvolved,
  facilities,
  isAdmin
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Insights</CardTitle>
        <CardDescription>
          Apply filters to refine the data visualization
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilter === 'custom' && (
              <div className="mt-2">
                <DatePickerWithRange date={dateRange} onChange={handleDateRangeChange} />
              </div>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Incident Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Incident">Incidents</SelectItem>
                <SelectItem value="Near Miss">Near Misses</SelectItem>
                <SelectItem value="Unsafe Condition">Unsafe Conditions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Physical Injury">Physical Injury</SelectItem>
                <SelectItem value="Behavioral Incident">Behavioral</SelectItem>
                <SelectItem value="Health Emergency">Health Emergency</SelectItem>
                <SelectItem value="Security Event">Security</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Subcategory</label>
            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {availableSubcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Person Involved</label>
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {peopleInvolved.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Student">Students</SelectItem>
                <SelectItem value="Teacher">Teachers</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
                <SelectItem value="Visitor">Visitors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isAdmin && (
          <div>
            <label className="text-sm font-medium mb-2 block">Facility</label>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.name}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightsFilters;
