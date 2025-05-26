
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TemplateBasicInfoProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  type: string;
  setType: (type: string) => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

const TemplateBasicInfo: React.FC<TemplateBasicInfoProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  type,
  setType,
  isActive,
  setIsActive
}) => {
  const templateTypes = [
    'Safety',
    'Compliance',
    'Risk',
    'Quality',
    'Environmental',
    'Security',
    'Training',
    'Maintenance'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Template Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter template title"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter template description"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="type">Assessment Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select assessment type" />
            </SelectTrigger>
            <SelectContent>
              {templateTypes.map((templateType) => (
                <SelectItem key={templateType} value={templateType}>
                  {templateType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="is-active">Enable Template</Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateBasicInfo;
