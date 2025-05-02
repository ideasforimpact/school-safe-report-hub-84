
import React, { useState } from 'react';
import { Action } from '@/types/incident';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

interface AddActionFormProps {
  onSubmit: (action: Action) => void;
}

const AddActionForm: React.FC<AddActionFormProps> = ({ onSubmit }) => {
  const [formAction, setFormAction] = useState<Action>({
    description: '',
    responsiblePerson: '',
    date: new Date(),
    image: undefined
  });

  const handleActionImageChange = (imageBase64: string | undefined) => {
    setFormAction(prev => ({ ...prev, image: imageBase64 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formAction);
    setFormAction({
      description: '',
      responsiblePerson: '',
      date: new Date(),
      image: undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Action Taken</CardTitle>
        <CardDescription>
          Record actions taken to address this incident
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
  );
};

export default AddActionForm;
