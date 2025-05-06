
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';

interface ChartPaginationProps {
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
}

const ChartPagination: React.FC<ChartPaginationProps> = ({ 
  currentPage, 
  totalPages, 
  handlePageChange 
}) => {
  // Create an array of page numbers for pagination
  const pageNumbers: (number | string)[] = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate start and end of visible range
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're near the beginning
    if (currentPage <= 3) {
      endPage = 4;
    }
    
    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push('ellipsis-start');
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push('ellipsis-end');
    }
    
    // Always show last page
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex justify-center mt-4">
      <Pagination>
        <PaginationContent>
          {/* Previous page button */}
          <PaginationItem>
            <PaginationLink
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          
          {/* Page numbers */}
          {pageNumbers.map((page, i) => (
            <PaginationItem key={`page-${i}`}>
              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                <span className="px-2">...</span>
              ) : (
                <PaginationLink
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  isActive={page === currentPage}
                  className={typeof page === 'number' ? "cursor-pointer" : ""}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          {/* Next page button */}
          <PaginationItem>
            <PaginationLink
              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ChartPagination;
