
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents, IncidentStatus, Action } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertOctagon, Clock, MapPin, Users } from 'lucide-react';

const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { incidents, getIncident, updateIncident } = useIncidents();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const incident = getIncident(id || '');

  const [formAction, setFormAction] = useState<Action>({
    description: '',
    responsiblePerson: '',
    date: new Date(),
  });

  const [statusUpdate, setStatusUpdate] = useState<IncidentStatus>(incident?.status || 'Open');

  if (!incident) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Incident not found</h2>
          <p className="text-gray-600 mt-2">The incident you're looking for doesn't exist or has been removed.</p>
          <Button 
            variant="link" 
            className="mt-4"
            onClick={() => navigate('/incidents')}
          >
            Return to Incidents List
          </Button>
        </div>
      </Layout>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch(status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = () => {
    updateIncident(incident.id, { status: statusUpdate });
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add the new action to the incident
    const newActions = [
      ...(incident.actions || []),
      formAction
    ];
    
    updateIncident(incident.id, { actions: newActions });
    
    // Reset form
    setFormAction({
      description: '',
      responsiblePerson: '',
      date: new Date(),
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 -ml-2" 
              onClick={() => navigate('/incidents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incidents
            </Button>
            
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>{incident.type}: {incident.category}</span>
              <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(incident.status)}`}>
                {incident.status}
              </span>
            </h1>
            
            <p className="text-gray-600 text-sm mt-1">
              Reported by {incident.reportedBy.name} on {formatDateTime(incident.createdAt)}
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Select 
                value={statusUpdate} 
                onValueChange={setStatusUpdate}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleStatusChange}>
                Update Status
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="mt-1">{incident.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <AlertOctagon className="h-5 w-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Type & Category</p>
                      <p className="text-gray-600">{incident.type} / {incident.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Date & Time of Occurrence</p>
                      <p className="text-gray-600">{formatDateTime(incident.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{incident.location}</p>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <div className="flex items-start space-x-2 mb-3">
                    <Users className="h-5 w-5 text-primary-600 mt-0.5" />
                    <h3 className="font-medium">People Involved</h3>
                  </div>
                  
                  {incident.peopleInvolved && incident.peopleInvolved.length > 0 ? (
                    <div className="space-y-3">
                      {incident.peopleInvolved.map((person, index) => (
                        <div key={index} className="border rounded p-3 bg-gray-50">
                          <div className="flex justify-between">
                            <p className="font-medium">{person.name}</p>
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">
                              {person.role}
                            </span>
                          </div>
                          {person.notes && (
                            <p className="text-sm text-gray-600 mt-1">{person.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No people recorded for this incident</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Add Action Taken</CardTitle>
                  <CardDescription>
                    Record actions taken to address this incident
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleActionSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="actionDescription" className="text-sm font-medium">
                        Action Description
                      </label>
                      <Textarea
                        id="actionDescription"
                        placeholder="Describe what was done to address the incident"
                        value={formAction.description}
                        onChange={(e) => setFormAction(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="responsiblePerson" className="text-sm font-medium">
                          Responsible Person
                        </label>
                        <Input
                          id="responsiblePerson"
                          placeholder="Who handled this action"
                          value={formAction.responsiblePerson}
                          onChange={(e) => setFormAction(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="actionDate" className="text-sm font-medium">
                          Date
                        </label>
                        <Input
                          type="date"
                          id="actionDate"
                          value={formAction.date ? new Date(formAction.date).toISOString().split('T')[0] : ''}
                          onChange={(e) => setFormAction(prev => ({ ...prev, date: new Date(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">Add Action</Button>
                  </CardFooter>
                </form>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Actions Taken</CardTitle>
                <CardDescription>
                  Steps taken to address this incident
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incident.actions && incident.actions.length > 0 ? (
                  <div className="space-y-4">
                    {incident.actions.map((action, index) => (
                      <div key={index} className="border rounded-md p-4 bg-gray-50">
                        <p className="font-medium text-sm">{formatDate(action.date)}</p>
                        <p className="mt-1">{action.description}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          By: {action.responsiblePerson}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No actions recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentDetail;
