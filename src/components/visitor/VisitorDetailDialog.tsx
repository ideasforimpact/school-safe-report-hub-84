import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Download, User } from 'lucide-react';
import { visitorService, Visitor, VisitorKYC } from '@/services/visitor/visitorService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatSupabaseUrl } from '@/types/fileTypes';

interface VisitorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitorId: string | null;
  clientId: string | null;
}

const VisitorDetailDialog: React.FC<VisitorDetailDialogProps> = ({
  open,
  onOpenChange,
  visitorId,
  clientId
}) => {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && visitorId && clientId) {
      fetchVisitorDetails();
    } else {
      setVisitor(null);
    }
  }, [open, visitorId, clientId]);

  const fetchVisitorDetails = async () => {
    if (!visitorId || !clientId) return;

    try {
      setLoading(true);
      const data = await visitorService.getVisitorById(visitorId, clientId);
      setVisitor(data);
    } catch (error: any) {
      console.error('Error fetching visitor details:', error);
      toast.error(error?.message || 'Failed to fetch visitor details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (file: { path?: string; url?: string; name: string }) => {
    try {
      const url = file.url;
      if (url) {
        // Use file.url directly and format it (same as VehicleTabs)
        const formattedUrl = formatSupabaseUrl(url);
        console.log(formattedUrl,"formattedUrl");
        
        // Open in new tab - browser will display if URL is correct
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No file URL available');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to open file');
    }
  };

  const handleDownloadFile = async (file: { path?: string; url?: string; name: string }) => {
    try {
      let downloadUrl: string;
      const fileName = getOriginalFileName(file.name || 'file');
      
      // If we have a file path, use Supabase storage API to create a signed URL
      if (file.path) {
        const { data, error } = await supabase.storage
          .from('visitors_evidence')
          .createSignedUrl(file.path, 300, { download: fileName });
        
        if (error || !data?.signedUrl) {
          // Fallback to direct URL if signed URL fails
          downloadUrl = file.url ? formatSupabaseUrl(file.url) : '';
          if (!downloadUrl) {
            throw new Error('Failed to generate download URL');
          }
        } else {
          downloadUrl = data.signedUrl;
        }
      } else {
        // Use the formatted URL directly
        if (!file.url) {
          throw new Error('No file URL available');
        }
        downloadUrl = formatSupabaseUrl(file.url);
      }
      
      // Fetch the file
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success(`Downloading ${fileName}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to download file');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Extract original filename from name field (remove timestamp and random string prefix if present)
  // Format: {timestamp}_{random}_{originalName} or just {originalName}
  const getOriginalFileName = (fileName: string): string => {
    if (!fileName) return '';
    
    // Check if filename starts with timestamp pattern (13 digits followed by underscore)
    const timestampPattern = /^\d{13}_[a-z0-9]+_/;
    if (timestampPattern.test(fileName)) {
      // Remove timestamp and random string prefix
      // Find the last underscore before the actual filename
      const parts = fileName.split('_');
      // Skip first two parts (timestamp and random string), join the rest
      if (parts.length > 2) {
        return parts.slice(2).join('_');
      }
    }
    
    // If no timestamp pattern, return as is (already original name)
    return fileName;
  };

  if (!visitor && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Visitor Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading visitor details...</p>
            </div>
          </div>
        ) : visitor ? (
          <div className="flex flex-col h-full">
            <Tabs defaultValue="kyc" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="kyc">KYC Details</TabsTrigger>
                <TabsTrigger value="evidence">
                  Evidence Files
                  {visitor.evidence_files && visitor.evidence_files.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {visitor.evidence_files.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kyc" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>KYC Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visitor.visitor_kyc && visitor.visitor_kyc.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document Type</TableHead>
                            <TableHead>Document Number</TableHead>
                            <TableHead>Created At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visitor.visitor_kyc.map((kyc: VisitorKYC) => (
                            <TableRow key={kyc.id}>
                              <TableCell className="font-medium">{kyc.document_type}</TableCell>
                              <TableCell>{kyc.document_no}</TableCell>
                              <TableCell>{formatDate(kyc.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No KYC documents found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evidence" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evidence Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visitor.evidence_files && visitor.evidence_files.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visitor.evidence_files.map((file, index) => {
                            const originalFileName = getOriginalFileName(file.name);
                            return (
                            <TableRow key={index}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                {originalFileName}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {file.type || 'Unknown'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewFile(file)}
                                    title="View file"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadFile(file)}
                                    title="Download file"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No evidence files found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default VisitorDetailDialog;

