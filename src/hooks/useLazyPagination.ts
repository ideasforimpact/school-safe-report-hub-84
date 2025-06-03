
import { useState, useCallback, useMemo } from 'react';

interface LazyPaginationOptions {
  initialPageSize?: number;
  loadMoreThreshold?: number;
}

interface LazyPaginationResult<T> {
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  totalLoaded: number;
  paginatedItems: T[];
  loadNextPage: () => void;
  resetPagination: () => void;
  setPageSize: (size: number) => void;
}

export function useLazyPagination<T>(
  items: T[],
  options: LazyPaginationOptions = {}
): LazyPaginationResult<T> {
  const { 
    initialPageSize = 10,
    loadMoreThreshold = 5 
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Calculate how many items to show based on current page
  const totalToShow = currentPage * pageSize;
  
  // Get the items to display (lazy loaded)
  const paginatedItems = useMemo(() => {
    return items.slice(0, totalToShow);
  }, [items, totalToShow]);

  // Check if there are more items to load
  const hasMore = useMemo(() => {
    return totalToShow < items.length;
  }, [totalToShow, items.length]);

  // Load next page
  const loadNextPage = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Update page size
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  return {
    currentPage,
    pageSize,
    hasMore,
    totalLoaded: paginatedItems.length,
    paginatedItems,
    loadNextPage,
    resetPagination,
    setPageSize
  };
}
