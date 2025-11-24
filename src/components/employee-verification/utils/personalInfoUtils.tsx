import React from 'react';
import { Badge } from '@/components/ui/badge';
import { VerificationDocument } from '@/types/employeeVerification';

// Format document name for display (replace underscores with spaces, capitalize)
const formatDocumentName = (documentTypeName: string): string => {
  if (!documentTypeName) return 'UNKNOWN DOCUMENT';
  
  // Replace underscores and hyphens with spaces, then convert to uppercase
  return documentTypeName
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

// Get badge color based on document type
const getDocumentBadgeColor = (documentTypeName: string): string => {
  const type = documentTypeName?.toLowerCase() || '';
  
  if (type.includes('aadhar') || type.includes('aadhaar')) {
    return 'bg-blue-100 text-blue-800';
  } else if (type.includes('pan')) {
    return 'bg-purple-100 text-purple-800';
  } else if (type.includes('driving') || type.includes('license')) {
    return 'bg-green-100 text-green-800';
  } else if (type.includes('passport')) {
    return 'bg-red-100 text-red-800';
  } else if (type.includes('voter')) {
    return 'bg-orange-100 text-orange-800';
  } else if (type.includes('bank')) {
    return 'bg-yellow-100 text-yellow-800';
  } else {
    return 'bg-gray-100 text-gray-800';
  }
};

// Aggregate personal_info from documents
export interface AggregatedPersonalInfo {
  dob: {
    commonValue?: string;
    differentValues: Array<{ documentName: string; value: string; badgeColor: string }>;
  };
  address: {
    commonValue?: string;
    differentValues: Array<{ documentName: string; value: string; badgeColor: string }>;
  };
}

export const aggregatePersonalInfo = (documents: VerificationDocument[]): AggregatedPersonalInfo => {
  const dobMap = new Map<string, Set<string>>(); // value -> set of document names
  const addressMap = new Map<string, Set<string>>(); // value -> set of document names
  
  // Collect all dob and address values from documents
  documents.forEach(doc => {
    if (doc.personalInfo) {
      const docName = doc.documentTypeName || 'Unknown Document';
      const badgeColor = getDocumentBadgeColor(docName);
      
      // Process dob
      if (doc.personalInfo.dob && doc.personalInfo.dob.trim()) {
        const dobValue = doc.personalInfo.dob.trim();
        if (!dobMap.has(dobValue)) {
          dobMap.set(dobValue, new Set());
        }
        dobMap.get(dobValue)!.add(docName);
      }
      
      // Process address
      if (doc.personalInfo.address && doc.personalInfo.address.trim()) {
        const addressValue = doc.personalInfo.address.trim();
        if (!addressMap.has(addressValue)) {
          addressMap.set(addressValue, new Set());
        }
        addressMap.get(addressValue)!.add(docName);
      }
    }
  });
  
  // Determine common values (same value across all documents that have the field)
  const dobValues = Array.from(dobMap.entries());
  const addressValues = Array.from(addressMap.entries());
  
  // Find common dob (if all documents with dob have the same value)
  let commonDob: string | undefined;
  if (dobValues.length === 1) {
    // Only one unique dob value means all documents have the same dob
    commonDob = dobValues[0][0];
  } else if (dobValues.length > 1) {
    // Check if all documents point to the same value
    const allDocNamesWithDob = new Set(dobValues.flatMap(([_, docs]) => Array.from(docs)));
    const uniqueValues = new Set(dobValues.map(([value]) => value));
    
    // If there's only one unique value and it covers all documents, it's common
    if (uniqueValues.size === 1) {
      const allDocsForValue = dobValues[0][1];
      if (allDocsForValue.size === allDocNamesWithDob.size) {
        commonDob = dobValues[0][0];
      }
    }
  }
  
  // Find common address (if all documents with address have the same value)
  let commonAddress: string | undefined;
  if (addressValues.length === 1) {
    // Only one unique address value means all documents have the same address
    commonAddress = addressValues[0][0];
  } else if (addressValues.length > 1) {
    // Check if all documents point to the same value
    const allDocNamesWithAddress = new Set(addressValues.flatMap(([_, docs]) => Array.from(docs)));
    const uniqueValues = new Set(addressValues.map(([value]) => value));
    
    // If there's only one unique value and it covers all documents, it's common
    if (uniqueValues.size === 1) {
      const allDocsForValue = addressValues[0][1];
      if (allDocsForValue.size === allDocNamesWithAddress.size) {
        commonAddress = addressValues[0][0];
      }
    }
  }
  
  // Build different values arrays
  const differentDobs: Array<{ documentName: string; value: string; badgeColor: string }> = [];
  const differentAddresses: Array<{ documentName: string; value: string; badgeColor: string }> = [];
  
  dobValues.forEach(([value, docNames]) => {
    if (value !== commonDob) {
      docNames.forEach(docName => {
        differentDobs.push({
          documentName: docName,
          value: value,
          badgeColor: getDocumentBadgeColor(docName)
        });
      });
    }
  });
  
  addressValues.forEach(([value, docNames]) => {
    if (value !== commonAddress) {
      docNames.forEach(docName => {
        differentAddresses.push({
          documentName: docName,
          value: value,
          badgeColor: getDocumentBadgeColor(docName)
        });
      });
    }
  });
  
  return {
    dob: {
      commonValue: commonDob,
      differentValues: differentDobs
    },
    address: {
      commonValue: commonAddress,
      differentValues: differentAddresses
    }
  };
};

// Render dob display
export const renderDobDisplay = (aggregated: AggregatedPersonalInfo, formatDate: (date: string) => string): React.ReactNode => {
  if (aggregated.dob.commonValue) {
    // All documents have the same dob
    return formatDate(aggregated.dob.commonValue);
  } else if (aggregated.dob.differentValues.length > 0) {
    // Different dobs from different documents
    return (
      <div className="flex flex-wrap items-center gap-3 pb-2">
        {aggregated.dob.differentValues.map((item, index) => (
          <div key={index} className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${item.badgeColor} px-2.5 py-1 font-medium`}>{formatDocumentName(item.documentName)}</Badge>
            <span className="text-sm font-medium">{formatDate(item.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return '';
};

// Render address display
export const renderAddressDisplay = (aggregated: AggregatedPersonalInfo): React.ReactNode => {
  if (aggregated.address.commonValue) {
    // All documents have the same address
    return aggregated.address.commonValue;
  } else if (aggregated.address.differentValues.length > 0) {
    // Different addresses from different documents
    return (
      <div className="flex flex-col gap-3 pb-2">
        {aggregated.address.differentValues.map((item, index) => (
          <div key={index} className="flex items-start gap-2 flex-shrink-0">
            <Badge className={`${item.badgeColor} px-2.5 py-1 font-medium flex-shrink-0`}>{formatDocumentName(item.documentName)}</Badge>
            <span className="text-sm font-medium break-words">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return '';
};

