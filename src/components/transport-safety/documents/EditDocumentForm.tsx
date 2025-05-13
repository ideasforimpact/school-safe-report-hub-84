
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { VehicleDocument } from '@/types/transportSafety';

interface EditDocumentFormProps {
  vehicleId: string;
  document: VehicleDocument;
  onClose: () => void;
}

const EditDocumentForm: React.FC<EditDocumentFormProps> = ({ vehicleId, document, onClose }) => {
  const { updateDocument } = useTransportSafety();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VehicleDocument>({
    defaultValues: {
      ...document,
      issuedDate: new Date(document.issuedDate).toISOString().split('T')[0],
      expiryDate: new Date(document.expiryDate).toISOString().split('T')[0],
    }
  });

  const documentType = watch('type');

  // Handle select changes
  React.useEffect(() => {
    register('type');
  }, [register]);

  const onSubmit = (data: VehicleDocument) => {
    updateDocument(vehicleId, document.id, {
      ...data,
      issuedDate: new Date(data.issuedDate).toISOString(),
      expiryDate: new Date(data.expiryDate).toISOString()
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Document Type*</Label>
        <Select 
          defaultValue={document.type} 
          onValueChange={(value) => setValue('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="fitness">Fitness Certificate</SelectItem>
            <SelectItem value="pollution">Pollution Certificate</SelectItem>
            <SelectItem value="registration">Registration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">{documentType === 'insurance' ? 'Policy Number' : 'Certificate Number'}*</Label>
        <Input 
          id="number" 
          {...register('number', { required: "Number is required" })}
          placeholder="Enter document number"
        />
        {errors.number && 
          <p className="text-red-500 text-sm">{errors.number.message}</p>
        }
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issuedDate">Issue Date*</Label>
          <Input 
            id="issuedDate" 
            type="date"
            {...register('issuedDate', { required: "Issue date is required" })}
          />
          {errors.issuedDate && 
            <p className="text-red-500 text-sm">{errors.issuedDate.message}</p>
          }
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date*</Label>
          <Input 
            id="expiryDate" 
            type="date"
            {...register('expiryDate', { required: "Expiry date is required" })}
          />
          {errors.expiryDate && 
            <p className="text-red-500 text-sm">{errors.expiryDate.message}</p>
          }
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuedBy">Issuer*</Label>
        <Input 
          id="issuedBy" 
          {...register('issuedBy', { required: "Issuer is required" })}
          placeholder="Enter issuer name"
        />
        {errors.issuedBy && 
          <p className="text-red-500 text-sm">{errors.issuedBy.message}</p>
        }
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider">Provider*</Label>
        <Input 
          id="provider" 
          {...register('provider', { required: "Provider is required" })}
          placeholder="Enter provider name"
        />
        {errors.provider && 
          <p className="text-red-500 text-sm">{errors.provider.message}</p>
        }
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Update Document
        </Button>
      </div>
    </form>
  );
};

export default EditDocumentForm;
