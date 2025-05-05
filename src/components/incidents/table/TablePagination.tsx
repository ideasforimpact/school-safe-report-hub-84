
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, current page, and pages around it
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i++) {
          pageNumbers.push(i);
        }
        if (totalPages > maxVisiblePages) pageNumbers.push(-1); // Ellipsis
      } else if (currentPage > totalPages - 3) {
        // Near the end
        pageNumbers.push(1, -1); // First page and ellipsis
        for (let i = Math.max(totalPages - maxVisiblePages + 3, 1); i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle
        pageNumbers.push(1, -1); // First page and ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push(-1, totalPages); // Ellipsis and last page
      }
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="py-4 border-t">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {currentPage === 1 ? (
              <PaginationPrevious 
                aria-disabled="true"
                className="pointer-events-none opacity-50"
              />
            ) : (
              <PaginationPrevious 
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                className="cursor-pointer"
              />
            )}
          </PaginationItem>
          
          {getPageNumbers().map((pageNum, index) => 
            pageNum === -1 ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <span className="flex h-10 w-10 items-center justify-center">...</span>
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={currentPage === pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          
          <PaginationItem>
            {currentPage === totalPages ? (
              <PaginationNext 
                aria-disabled="true" 
                className="pointer-events-none opacity-50"
              />
            ) : (
              <PaginationNext 
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                className="cursor-pointer"
              />
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
