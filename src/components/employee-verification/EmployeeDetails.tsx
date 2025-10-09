import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Employee, VerificationDocument } from '@/types/employeeVerification';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import EditEmployeeDialog from './EditEmployeeDialog';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import VerificationStatusSummary from './VerificationStatusSummary';
import { formatDepartment } from '@/lib/formatUtils';

interface EmployeeDetailsProps {
  employee: Employee;
  documents?: VerificationDocument[];
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, documents }) => {
  const { getEmployeeDocuments } = useEmployeeVerification();
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Pull Aadhaar-derived values (dob, profile image) from API response if present
  const getAadhaarDerived = (): { dob?: string; profileImage?: string; address?: string } => {
    const docs = documents || getEmployeeDocuments(employee.id);
    if (!docs || docs.length === 0) return {};

    const aadhar = docs.find(d => {
      const name = d.documentTypeName?.toLowerCase() || '';
      const isAadhaar = name.includes('aadhar') || name.includes('aadhaar');
      const viaApi = (d.apiVerificationMethod || d.verificationMethod) === 'api';
      return isAadhaar && viaApi && !!d.apiResponseData;
    });

    if (!aadhar || !aadhar.apiResponseData) return {};

    // Most responses are { data: {...} }. Fallback to root if needed.
    const root: any = aadhar.apiResponseData?.data ?? aadhar.apiResponseData;

    const dob: string | undefined = root?.dob;
    const rawImage: string | undefined = root?.profile_image || root?.photo || root?.image || root?.image_link;

    const profileImage = (() => {
      if (!rawImage || typeof rawImage !== 'string') return undefined;
      if (rawImage.startsWith('http') || rawImage.startsWith('https') || rawImage.startsWith('data:')) return rawImage;
      return `data:image/jpeg;base64,${rawImage}`;
    })();

    // Build address string from various possible shapes
    const rawAddress = root?.address as any;

    let address: string | undefined;
    if (typeof rawAddress === 'string') {
      address = rawAddress;
    } else if (rawAddress && typeof rawAddress === 'object') {
      const parts = [
        rawAddress.house,
        rawAddress.street,
        rawAddress.landmark,
        rawAddress.loc,
        rawAddress.vtc || rawAddress.city || rawAddress.town,
        rawAddress.subdist,
        rawAddress.dist || rawAddress.district,
        rawAddress.state,
        rawAddress.zip || rawAddress.pincode,
        rawAddress.country,
      ].filter(Boolean);
      address = parts.join(', ');
    }

    return { dob, profileImage, address };
  };

  const { dob: aadharDob, profileImage: aadharProfileImage, address: aadharAddress } = getAadhaarDerived();

  const getEmployeeTypeDisplay = (type?: string) => {
    if (!type) return 'Not Specified';
    
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Calculate verification summary from employee documents
  const getVerificationSummary = () => {
    const employeeDocuments = documents || getEmployeeDocuments(employee.id);
    
    const verified = employeeDocuments.filter(doc => 
      doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed'
    ).length;
    
    const pending = employeeDocuments.filter(doc => 
      doc.verificationStatus === 'pending' || doc.verificationStatus === 'in-progress'
    ).length;
    
    const failed = employeeDocuments.filter(doc => 
      doc.verificationStatus === 'failed' || doc.verificationStatus === 'rejected'
    ).length;
    
    return {
      verified,
      pending,
      failed,
      total: employeeDocuments.length
    };
  };

  return (
    <Card>
      <CardContent className="pt-6 text-left">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-left">{employee.name}</h2>
            <p className="text-gray-500 text-left">{getEmployeeTypeDisplay(employee.employeeType)} · {formatDepartment(employee.department)}</p>
          </div>
          {aadharProfileImage && (
            <div className="shrink-0 ml-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                <img
                  src={aadharProfileImage}
                  alt="Aadhaar Profile"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-6">
          <div>
            <p className="text-sm text-gray-500 text-left">Employee ID</p>
            <p className="font-medium text-left">{employee.employeeId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Email</p>
            <p className="font-medium text-left">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Phone</p>
            <p className="font-medium text-left">{employee.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Date of Birth</p>
            <p className="font-medium text-left">{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : (aadharDob ? formatDate(aadharDob) : '')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Joining Date</p>
            <p className="font-medium text-left">{formatDate(employee.joiningDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Department</p>
            <p className="font-medium text-left">{formatDepartment(employee.department)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Designation</p>
            <p className="font-medium text-left">{employee.designation || ''}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 text-left">Employee Type</p>
            <p className="font-medium text-left">{getEmployeeTypeDisplay(employee.employeeType)}</p>
          </div>
          <div>
            <div className="font-medium text-left">
              <VerificationStatusSummary summary={getVerificationSummary()} />
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 text-left">Address</p>
            <p className="font-medium text-left">{employee.address || aadharAddress}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDetails;
