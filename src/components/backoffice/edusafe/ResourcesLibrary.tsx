
import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, ExternalLink, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { EduSafeProvider, useEduSafe } from '@/contexts/edusafe/EduSafeContext';
import { EduSafeResource } from '@/types/eduSafeTypes';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TablePaginationBar from '@/components/common/TablePaginationBar';

const ResourcesLibraryInner: React.FC = () => {
  const { resources, downloadResource, deleteResource, refreshResources, totalCount } = useEduSafe();
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const isFirstRender = useRef(true);
  const PAGE_SIZE = 10;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    refreshResources(searchQuery, page, PAGE_SIZE);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
    refreshResources(searchQuery, 1, PAGE_SIZE);
  }, [searchQuery, refreshResources]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Refetch the corrected page too, not just relabel the pagination bar,
  // otherwise the list keeps showing the stale/empty data from the old page.
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
      refreshResources(searchQuery, totalPages, PAGE_SIZE);
    }
  }, [totalCount, totalPages, currentPage, searchQuery, refreshResources]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = (resource: EduSafeResource) => {
    downloadResource(resource);
  };

  const handleDelete = () => {
    if (resourceToDelete) {
      deleteResource(resourceToDelete);
      setResourceToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <DebouncedSearchInput
          placeholder="Search resources..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="flex-1"
          triggerOnEnter
        />
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">
            {totalCount} resource{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length > 0 ? (
              resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      {resource.title}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(resource.uploadDate)}</TableCell>
                  <TableCell>
                    <span className="text-xs uppercase">
                      {resource.file.type.split('/').pop() || resource.file.name.split('.').pop()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(resource)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setResourceToDelete(resource.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No resources match your search' : 'No resources available'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          itemLabel="resources"
          onPageChange={handlePageChange}
        />
      </div>

      <AlertDialog open={!!resourceToDelete} onOpenChange={() => setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resource and remove it from all client institutions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Wrapper component to ensure EduSafeProvider is available
const ResourcesLibrary: React.FC = () => {
  return (
    <EduSafeProvider>
      <ResourcesLibraryInner />
    </EduSafeProvider>
  );
};

export default ResourcesLibrary;
