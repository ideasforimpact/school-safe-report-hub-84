import React from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';

interface TablePaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
  itemLabel?: string;
}

const TablePaginationBar: React.FC<TablePaginationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  itemLabel = 'items',
}) => {
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    return [1, 2, 'ellipsis', totalPages - 1, totalPages];
  };

  if (totalPages <= 1) return null;

  const showCount = totalCount !== undefined && pageSize !== undefined;
  const startItem = showCount ? (totalCount === 0 ? 0 : (currentPage - 1) * pageSize! + 1) : null;
  const endItem   = showCount ? Math.min(currentPage * pageSize!, totalCount!) : null;

  return (
    <div className="flex flex-col gap-2 px-6 py-4 border-t border-gray-200">
      {/* Showing count — first line */}
      {showCount && (
        <p className="text-sm text-gray-500">
          Showing {startItem}–{endItem} of {totalCount} {itemLabel}
        </p>
      )}

      {/* Pagination controls — second line, centered */}
      <div className="flex items-center justify-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
          className="h-9 w-9 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Pagination className="mx-0 w-auto">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {getPageNumbers().map((page, i) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => onPageChange(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
          className="h-9 w-9 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
};

export default TablePaginationBar;
