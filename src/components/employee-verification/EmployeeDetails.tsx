import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Employee, VerificationDocument } from '@/types/employeeVerification';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import EditEmployeeDialog from './EditEmployeeDialog';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import VerificationStatusSummary from './VerificationStatusSummary';
import { formatDepartment } from '@/lib/formatUtils';
import { aggregatePersonalInfo, renderDobDisplay, renderAddressDisplay } from './utils/personalInfoUtils';

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

  // Pull Aadhaar-derived values (profile image) from API response if present
  const getAadhaarDerived = (): { profileImage?: string } => {
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

    const rawImage: string | undefined = root?.profile_image || root?.photo || root?.image || root?.image_link;

    const profileImage = (() => {
      if (!rawImage || typeof rawImage !== 'string') return undefined;
      if (rawImage.startsWith('http') || rawImage.startsWith('https') || rawImage.startsWith('data:')) return rawImage;
      return `data:image/jpeg;base64,${rawImage}`;
    })();

    return { profileImage };
  };

  const { profileImage: aadharProfileImage } = getAadhaarDerived();
  
  // Aggregate personal_info from all documents
  const docs = documents || getEmployeeDocuments(employee.id);
  const aggregatedPersonalInfo = aggregatePersonalInfo(docs);

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

  // Prepare truncated name for card display (limit 200 chars with tooltip)
  const fullName = employee.name || '';
  const displayName =
    fullName.length > 200 ? `${fullName.slice(0, 200)}…` : fullName;

  return (
    <Card>
      <CardContent className="pt-6 text-left">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center flex-wrap gap-2">
              <h2
                className="text-2xl font-bold text-left max-w-3xl truncate"
                title={fullName}
              >
                {displayName}
              </h2>
              {/* Overall verification status moved near name */}
              <VerificationStatusSummary summary={getVerificationSummary()} />
            </div>
            <p className="text-gray-500 text-left">
              {getEmployeeTypeDisplay(employee.employeeType)} · {formatDepartment(employee.department)}
            </p>
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
            <div className="font-medium text-left pb-1">
              {employee.dateOfBirth 
                ? formatDate(employee.dateOfBirth) 
                : renderDobDisplay(aggregatedPersonalInfo, formatDate)}
            </div>
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
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 text-left">Address</p>
            <div className="font-medium text-left pb-1">
              {employee.address || renderAddressDisplay(aggregatedPersonalInfo)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDetails;
