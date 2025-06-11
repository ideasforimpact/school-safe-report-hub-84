
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Scale, TestTube, Shield, Upload } from 'lucide-react';
import BankStatementAnalysisTab from './tabs/BankStatementAnalysisTab';
import CourtCaseCheckTab from './tabs/CourtCaseCheckTab';
import DrugTestTab from './tabs/DrugTestTab';
import PoliceVerificationTab from './tabs/PoliceVerificationTab';
import DocumentsTab from './tabs/DocumentsTab';
import { FileItem } from '@/types/fileTypes';

interface DocumentVerificationTabsProps {
  employeeId: string;
  selectedTypeId: string | null;
  files: FileItem[];
  isSubmitting: boolean;
  onSelectedTypeChange: (typeId: string) => void;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  onFileUploaded: (base64: string) => void;
  onSuccess?: () => void;
}

const DocumentVerificationTabs: React.FC<DocumentVerificationTabsProps> = ({
  employeeId,
  selectedTypeId,
  files,
  isSubmitting,
  onSelectedTypeChange,
  onSubmit,
  onCancel,
  onFileUploaded,
  onSuccess
}) => {
  return (
    <Tabs defaultValue="documents" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="bank-analysis" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Bank Analysis</span>
          <span className="sm:hidden">Bank</span>
        </TabsTrigger>
        <TabsTrigger value="court-case" className="flex items-center gap-2">
          <Scale className="h-4 w-4" />
          <span className="hidden sm:inline">Court Case</span>
          <span className="sm:hidden">Court</span>
        </TabsTrigger>
        <TabsTrigger value="drug-test" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          <span className="hidden sm:inline">Drug Test</span>
          <span className="sm:hidden">Drug</span>
        </TabsTrigger>
        <TabsTrigger value="police-verification" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Police</span>
          <span className="sm:hidden">Police</span>
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Documents</span>
          <span className="sm:hidden">Docs</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bank-analysis" className="mt-6">
        <BankStatementAnalysisTab 
          employeeId={employeeId} 
          onSubmit={onSuccess}
        />
      </TabsContent>

      <TabsContent value="court-case" className="mt-6">
        <CourtCaseCheckTab 
          employeeId={employeeId} 
          onSubmit={onSuccess}
        />
      </TabsContent>

      <TabsContent value="drug-test" className="mt-6">
        <DrugTestTab 
          employeeId={employeeId} 
          onSubmit={onSuccess}
        />
      </TabsContent>

      <TabsContent value="police-verification" className="mt-6">
        <PoliceVerificationTab 
          employeeId={employeeId} 
          onSubmit={onSuccess}
        />
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <DocumentsTab
          employeeId={employeeId}
          selectedTypeId={selectedTypeId}
          files={files}
          isSubmitting={isSubmitting}
          onSelectedTypeChange={onSelectedTypeChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onFileUploaded={onFileUploaded}
        />
      </TabsContent>
    </Tabs>
  );
};

export default DocumentVerificationTabs;
