
import React, { useState } from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  PieChart, 
  Bar, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { format, subDays, isWithinInterval } from 'date-fns';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHART_COLORS } from '@/utils/chartColorUtils';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

const ResultsAnalytics = () => {
  const { templates, assignments, responses } = useAssessment();
  
  // Filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [templateType, setTemplateType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter by date range
  const filteredResponses = responses.filter(response => {
    // Filter by date if date range is selected
    if (dateRange?.from && dateRange?.to && response.completedDate) {
      const responseDate = new Date(response.completedDate);
      return isWithinInterval(responseDate, { 
        start: dateRange.from, 
        end: dateRange.to 
      });
    }
    
    // If no date filter or the response doesn't have a completed date
    return response.status === 'Submitted';
  });

  // Filter by template type if not "all"
  const typeFilteredResponses = templateType === "all" 
    ? filteredResponses 
    : filteredResponses.filter(response => {
        const template = templates.find(t => t.id === response.templateId);
        return template?.type === templateType;
      });
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResponses = typeFilteredResponses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(typeFilteredResponses.length / itemsPerPage);

  // Get unique template types for filter
  const templateTypes = [...new Set(templates.map(template => template.type))];

  // Calculate completion rate
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'Completed').length;
  const completionRate = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  
  // Calculate average score
  const submittedResponses = responses.filter(r => r.status === 'Submitted' && r.score !== null);
  const totalScore = submittedResponses.reduce((sum, response) => sum + (response.score || 0), 0);
  const averageScore = submittedResponses.length > 0 
    ? Math.round(totalScore / submittedResponses.length) 
    : 0;
  
  // Status distribution data for pie chart
  const statusCounts = assignments.reduce((acc, assignment) => {
    acc[assignment.status] = (acc[assignment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }));
  
  // Template type data for bar chart
  const templateCountsByType = templates.reduce((acc, template) => {
    acc[template.type] = (acc[template.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const templateTypeData = Object.entries(templateCountsByType).map(([type, count]) => ({
    name: type,
    count
  }));
  
  // Calculate overdue assignments
  const overdueAssignments = assignments.filter(a => {
    return a.status !== 'Completed' && new Date(a.dueDate) < new Date();
  }).length;

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': '#facc15', // yellow
      'In Progress': '#33C3F0', // blue
      'Completed': '#4ade80', // green
      'Overdue': '#ef4444', // red
    };
    return colors[status] || '#9b87f5'; // purple default
  };
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Assessment Results</h2>
      
      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date Range</Label>
              <div className="mt-1">
                <DatePickerWithRange
                  date={dateRange}
                  onChange={setDateRange}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="template-type">Template Type</Label>
              <Select 
                value={templateType} 
                onValueChange={setTemplateType}
              >
                <SelectTrigger id="template-type" className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {templateTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{completionRate}%</p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {completedAssignments} of {totalAssignments} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{averageScore}%</p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${averageScore}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Based on {submittedResponses.length} submitted assessments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{overdueAssignments}</p>
            <p className="text-sm text-gray-500 mt-2">
              Assessments past due date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{templates.length}</p>
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              {Object.entries(templateCountsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span>{type}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              Completion by Template Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templateTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip 
                  formatter={(value, name) => [`${value} templates`, name]}
                  labelFormatter={(label) => `Type: ${label}`}
                />
                <Bar dataKey="count" fill={CHART_COLORS.purple} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              Assessment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {assignments.length > 0 ? (
              <ChartContainer 
                config={{
                  status: { label: 'Status' },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getStatusColor(entry.name)} 
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Results</CardTitle>
        </CardHeader>
        <CardContent>
          {typeFilteredResponses.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No assessment responses match the current filters</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentResponses.map((response) => {
                      const template = templates.find(t => t.id === response.templateId);
                      const assignment = assignments.find(a => a.id === response.assignmentId);
                      
                      return (
                        <TableRow key={response.id}>
                          <TableCell className="font-medium">{template?.title || 'Unknown'}</TableCell>
                          <TableCell>{assignment?.userName || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(response.completedDate)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                response.status === 'Submitted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }
                            >
                              {response.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {response.score !== null ? `${response.score}%` : 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsAnalytics;
