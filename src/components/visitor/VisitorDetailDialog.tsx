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
      let viewUrl: string | null = null;
      console.log(file,"file");
      
      // If we have a path, construct the public URL from Supabase storage
      if (file.path) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        console.log(supabaseUrl,"supabaseUrl");
        
        if (!supabaseUrl) {
          throw new Error('Supabase URL is not configured');
        }
        // Construct URL: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
        viewUrl = `${supabaseUrl}/storage/v1/object/public/visitors_evidence/${file.path}`;
        console.log(viewUrl,"viewUrl");
        
      } else if (file.url) {
        // Use the URL directly if available
        viewUrl = file.url;
      } else {
        throw new Error('No file path or URL available');
      }

      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to open file');
    }
  };

  const handleDownloadFile = async (file: { path?: string; url?: string; name: string }) => {
    try {
      let downloadUrl: string | null = null;
      const fileName = file.name || 'file';

      // If we have a path, construct the public URL from Supabase storage
      if (file.path) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error('Supabase URL is not configured');
        }
        // Construct URL: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
        downloadUrl = `${supabaseUrl}/storage/v1/object/public/visitors_evidence/${file.path}`;
      } else if (file.url) {
        // Use the URL directly if available
        downloadUrl = file.url;
      } else {
        throw new Error('No file path or URL available');
      }

      // Fetch the file
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the blob
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
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
                          {visitor.evidence_files.map((file, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                {file.name}
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
                          ))}
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

