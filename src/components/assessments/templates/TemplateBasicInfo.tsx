import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
interface TemplateBasicInfoProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  type: string;
  setType: (value: string) => void;
}
const TemplateBasicInfo: React.FC<TemplateBasicInfoProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  type,
  setType
}) => {
  return <div className="space-y-4">
      <div>
        <Label htmlFor="title">Template Title</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter template title" className="mt-1" />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the purpose of this assessment template" className="mt-1" rows={3} />
      </div>
      
      <div>
        <Label>Template Category
      </Label>
        <RadioGroup value={type} onValueChange={setType} className="flex space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Safety" id="safety" />
            <Label htmlFor="safety">Safety</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Compliance" id="compliance" />
            <Label htmlFor="compliance">Compliance</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Risk" id="risk" />
            <Label htmlFor="risk">Risk</Label>
          </div>
        </RadioGroup>
      </div>
    </div>;
};
export default TemplateBasicInfo;