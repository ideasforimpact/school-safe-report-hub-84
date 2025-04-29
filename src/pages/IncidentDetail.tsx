import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidents, IncidentStatus, Action, ActionItem } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import ImageUpload from '@/components/ImageUpload'; // Import the ImageUpload component
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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, AlertOctagon, Clock, MapPin, 
  Users, Plus, Edit, Trash2, CheckCircle, 
  LayoutList, CalendarClock, UserCircle,
  Image
} from 'lucide-react';

const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { incidents, getIncident, updateIncident, addActionItem, updateActionItem, deleteActionItem } = useIncidents();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const incident = getIncident(id || '');

  const [formAction, setFormAction] = useState<Action>({
    description: '',
    responsiblePerson: '',
    date: new Date(),
    image: undefined // Add image field
  });

  const [statusUpdate, setStatusUpdate] = useState<IncidentStatus>(incident?.status || 'Open');
  
  // Action Item States
  const [showAddActionItem, setShowAddActionItem] = useState(false);
  const [showEditActionItem, setShowEditActionItem] = useState(false);
  const [currentActionItem, setCurrentActionItem] = useState<ActionItem | null>(null);
  const [actionItemForm, setActionItemForm] = useState<Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>>({
    description: '',
    dueDate: new Date(),
    assignedTo: '',
    status: 'Pending',
    createdBy: { id: user?.id || '', name: user?.name || '' },
    image: undefined // Add image field
  });

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

  const getActionItemStatusColor = (status: ActionItem['status']) => {
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

  const handleStatusChange = () => {
    updateIncident(incident.id, { status: statusUpdate });
  };

  const handleActionImageChange = (imageBase64: string | undefined) => {
    setFormAction(prev => ({ ...prev, image: imageBase64 }));
  };

  const handleActionItemImageChange = (imageBase64: string | undefined) => {
    setActionItemForm(prev => ({ ...prev, image: imageBase64 }));
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
      image: undefined
    });
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    addActionItem(incident.id, actionItemForm);
    setShowAddActionItem(false);
    resetActionItemForm();
  };

  const handleEditActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentActionItem) {
      updateActionItem(incident.id, currentActionItem.id, actionItemForm);
      setShowEditActionItem(false);
      setCurrentActionItem(null);
      resetActionItemForm();
    }
  };

  const handleDeleteActionItem = (actionItemId: string) => {
    if (confirm('Are you sure you want to delete this action item?')) {
      deleteActionItem(incident.id, actionItemId);
    }
  };

  const resetActionItemForm = () => {
    setActionItemForm({
      description: '',
      dueDate: new Date(),
      assignedTo: '',
      status: 'Pending',
      createdBy: { id: user?.id || '', name: user?.name || '' },
      image: undefined // Reset image
    });
  };

  const openEditActionItem = (item: ActionItem) => {
    setCurrentActionItem(item);
    setActionItemForm({
      description: item.description,
      dueDate: new Date(item.dueDate),
      assignedTo: item.assignedTo,
      status: item.status,
      createdBy: item.createdBy,
      image: item.image // Load existing image
    });
    setShowEditActionItem(true);
  };

  const canEditActionItem = (item: ActionItem) => {
    return isAdmin || item.createdBy.id === user?.id;
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
                onValueChange={(value: string) => {
                  // Cast incoming value to IncidentStatus type
                  setStatusUpdate(value as IncidentStatus);
                }}
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
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="mt-1">{incident.description}</p>

                  {/* Display incident image if available */}
                  {incident.image && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Image Documentation</h3>
                      <img 
                        src={incident.image} 
                        alt="Incident documentation" 
                        className="max-w-full h-auto rounded-md border" 
                      />
                    </div>
                  )}
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

            {/* Action Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Action Items</CardTitle>
                  <CardDescription>
                    Tasks to address this incident
                  </CardDescription>
                </div>
                <Dialog open={showAddActionItem} onOpenChange={setShowAddActionItem}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add Action Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Action Item</DialogTitle>
                      <DialogDescription>
                        Create a new action item for this incident
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddActionItem} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                          Description
                        </label>
                        <Textarea
                          id="description"
                          value={actionItemForm.description}
                          onChange={(e) => setActionItemForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="What needs to be done?"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Image Documentation (Optional)
                        </label>
                        <ImageUpload 
                          onImageChange={handleActionItemImageChange}
                          initialImage={actionItemForm.image}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="assignedTo" className="text-sm font-medium">
                            Assigned To
                          </label>
                          <Input
                            id="assignedTo"
                            value={actionItemForm.assignedTo}
                            onChange={(e) => setActionItemForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                            placeholder="Who will do this?"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="dueDate" className="text-sm font-medium">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            id="dueDate"
                            value={actionItemForm.dueDate ? new Date(actionItemForm.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setActionItemForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="status" className="text-sm font-medium">
                          Status
                        </label>
                        <Select 
                          value={actionItemForm.status} 
                          onValueChange={(value) => {
                            setActionItemForm(prev => ({ 
                              ...prev, 
                              status: value as ActionItem['status'] 
                            }));
                          }}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add Action Item</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {incident.actionItems && incident.actionItems.length > 0 ? (
                  <div className="space-y-4">
                    {incident.actionItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">{item.description}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <UserCircle className="h-3.5 w-3.5" />
                                <span>{item.assignedTo}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarClock className="h-3.5 w-3.5" />
                                <span>Due: {formatDate(new Date(item.dueDate))}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getActionItemStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Display action item image if available */}
                        {item.image && (
                          <div className="mt-3">
                            <img 
                              src={item.image} 
                              alt="Action item documentation" 
                              className="w-full max-h-40 object-contain rounded-md border" 
                            />
                          </div>
                        )}
                        
                        {canEditActionItem(item) && (
                          <div className="mt-3 flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditActionItem(item)}
                              className="h-7 px-2"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteActionItem(item.id)}
                              className="h-7 px-2"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">No action items added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Edit Action Item Dialog */}
            <Dialog open={showEditActionItem} onOpenChange={setShowEditActionItem}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Action Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditActionItem} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-description" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="edit-description"
                      value={actionItemForm.description}
                      onChange={(e) => setActionItemForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What needs to be done?"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Image Documentation (Optional)
                    </label>
                    <ImageUpload 
                      onImageChange={handleActionItemImageChange}
                      initialImage={actionItemForm.image}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="edit-assignedTo" className="text-sm font-medium">
                        Assigned To
                      </label>
                      <Input
                        id="edit-assignedTo"
                        value={actionItemForm.assignedTo}
                        onChange={(e) => setActionItemForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                        placeholder="Who will do this?"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="edit-dueDate" className="text-sm font-medium">
                        Due Date
                      </label>
                      <Input
                        type="date"
                        id="edit-dueDate"
                        value={actionItemForm.dueDate ? new Date(actionItemForm.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setActionItemForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="edit-status" className="text-sm font-medium">
                      Status
                    </label>
                    <Select 
                      value={actionItemForm.status} 
                      onValueChange={(value) => {
                        setActionItemForm(prev => ({ 
                          ...prev, 
                          status: value as ActionItem['status']
                        }));
                      }}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Update Action Item</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {isAdmin && (
              <Card>
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Image Documentation (Optional)
                      </label>
                      <ImageUpload 
                        onImageChange={handleActionImageChange}
                        initialImage={formAction.image}
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

                        {/* Display action image if available */}
                        {action.image && (
                          <div className="mt-3">
                            <img 
                              src={action.image} 
                              alt="Action documentation" 
                              className="w-full h-auto rounded-md border" 
                            />
                          </div>
                        )}
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
