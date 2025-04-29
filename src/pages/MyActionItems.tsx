import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useIncidents, ActionItem } from '@/contexts/IncidentContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CalendarClock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MyActionItems = () => {
  const { user } = useAuth();
  const { incidents, updateActionItem } = useIncidents();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();

  // Get all action items assigned to the current user
  const myActionItems = incidents.reduce<Array<{actionItem: ActionItem, incidentId: string, incidentType: string, incidentCategory: string}>>((acc, incident) => {
    const items = incident.actionItems?.filter(
      item => item.assignedTo.id === user?.id
    ) || [];

    const formattedItems = items.map(item => ({
      actionItem: item,
      incidentId: incident.id,
      incidentType: incident.type,
      incidentCategory: incident.category
    }));

    return [...acc, ...formattedItems];
  }, []);

  // Filter action items based on status
  const filteredActionItems = statusFilter === "all" 
    ? myActionItems 
    : myActionItems.filter(item => item.actionItem.status.toLowerCase() === statusFilter.toLowerCase());

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: ActionItem['status']) => {
    switch(status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (actionItemId: string, incidentId: string, newStatus: ActionItem['status']) => {
    updateActionItem(incidentId, actionItemId, { status: newStatus });
  };

  const isPastDue = (dueDate: Date) => {
    return new Date(dueDate) < new Date() && status !== 'Completed';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Action Items</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filter:</span>
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredActionItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredActionItems.map(({ actionItem, incidentId, incidentType, incidentCategory }) => (
              <Card key={actionItem.id} className={isPastDue(actionItem.dueDate) ? 'border-red-300' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{actionItem.description}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <CalendarClock className="h-3.5 w-3.5 mr-1" />
                        Due: {formatDate(actionItem.dueDate)}
                        {isPastDue(actionItem.dueDate) && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Overdue
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(actionItem.status)}`}>
                      {actionItem.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 mb-4">
                    <p className="font-medium text-gray-700">Incident: {incidentType} - {incidentCategory}</p>
                    <p>Assigned to: {actionItem.assignedTo.name}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/incidents/${incidentId}`)}
                    >
                      View Incident
                    </Button>
                    <Select 
                      value={actionItem.status} 
                      onValueChange={(value) => handleStatusChange(actionItem.id, incidentId, value as ActionItem['status'])}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">You don't have any {statusFilter !== 'all' ? statusFilter : ''} action items assigned to you.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default MyActionItems;
