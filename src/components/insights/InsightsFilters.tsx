
import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';

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
  peopleInvolved: string[];
  facilities: string[];
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
    <Card className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Filter Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date Range</label>
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
              <DatePickerWithRange 
                date={dateRange} 
                onChange={handleDateRangeChange} 
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Incident Type</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Incident">Incident</SelectItem>
              <SelectItem value="Near Miss">Near Miss</SelectItem>
              <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Physical Injury">Physical Injury</SelectItem>
              <SelectItem value="Bullying">Bullying</SelectItem>
              <SelectItem value="Tech Misuse">Tech Misuse</SelectItem>
              <SelectItem value="Property Damage">Property Damage</SelectItem>
              <SelectItem value="Health Concern">Health Concern</SelectItem>
              <SelectItem value="Security Breach">Security Breach</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subcategory</label>
          <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {availableSubcategories.map((subcategory) => (
                <SelectItem key={subcategory} value={subcategory}>
                  {subcategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium mb-1">Facility</label>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility} value={facility}>
                    {facility}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Person filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Person</label>
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
        
        {/* Role filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Student">Student</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
              <SelectItem value="Teacher">Teacher</SelectItem>
              <SelectItem value="Administrator">Administrator</SelectItem>
              <SelectItem value="Visitor">Visitor</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

export default InsightsFilters;
