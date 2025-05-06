
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";

interface BasicDetailsSectionProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
}

const BasicDetailsSection = ({
  name,
  setName,
  description,
  setDescription,
  dueDate,
  setDueDate,
}: BasicDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Assessment Name*</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Safety Inspection Form"
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose of this assessment"
          rows={3}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="due-date">Due Date (Optional)</Label>
        <DatePicker
          date={dueDate}
          onChange={setDueDate}
        />
      </div>
    </div>
  );
};

export default BasicDetailsSection;
