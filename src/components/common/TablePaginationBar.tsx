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

    const pages: (number | 'ellipsis')[] = [];

    // Show prev, current, next as a sliding window
    if (currentPage - 1 >= 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage + 1 <= totalPages) pages.push(currentPage + 1);

    // Ellipsis when there is a gap before the last two pages
    const lastVisible = pages[pages.length - 1] as number;
    if (lastVisible < totalPages - 2) pages.push('ellipsis');

    // Last two pages (only if not already shown above)
    if (totalPages - 1 > currentPage + 1) pages.push(totalPages - 1);
    if (totalPages > currentPage + 1) pages.push(totalPages);

    return pages;
  };

  const showCount = totalCount !== undefined && pageSize !== undefined;
  const showButtons = totalPages > 1;

  if (!showCount && !showButtons) return null;

  const startItem = showCount ? (totalCount === 0 ? 0 : (currentPage - 1) * pageSize! + 1) : null;
  const endItem   = showCount ? Math.min(currentPage * pageSize!, totalCount!) : null;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 py-4 border-t border-gray-200">
      {/* Showing count — bottom-left */}
      <div>
        {showCount && (
          <p className="text-sm text-gray-500 whitespace-nowrap">
            Showing {startItem}–{endItem} of {totalCount} {itemLabel}
          </p>
        )}
      </div>

      {/* Pagination controls — centered */}
      {showButtons && (
        <div className="flex items-center gap-1">
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
                      onClick={() => page !== currentPage && onPageChange(page)}
                      className={page === currentPage ? 'pointer-events-none cursor-default' : 'cursor-pointer'}
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
      )}

      {/* Empty spacer — balances the count column so the buttons stay centered */}
      <div />
    </div>
  );
};

export default TablePaginationBar;
