import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  setItemsPerPage?: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  setItemsPerPage
}) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Generate page numbers, with ellipsis for many pages
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first and last page, plus some around current page
      pages.push(1);
      
      if (currentPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 py-3 border-t-3 border-brutalism-black">
      {/* Total items info */}
      {totalItems !== undefined && (
        <div className="text-sm font-medium">
          Showing {Math.min(itemsPerPage || 10, totalItems - (currentPage - 1) * (itemsPerPage || 10))} of {totalItems} items
        </div>
      )}
      
      {/* Items per page selector */}
      {setItemsPerPage && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Show</span>
          <select 
            className="py-1 px-2 border-2 border-brutalism-black"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm font-medium">per page</span>
        </div>
      )}
      
      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={isFirstPage}
          className={`p-2 border-2 border-brutalism-black ${
            isFirstPage 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white hover:bg-brutalism-yellow/20 shadow-brutal-xs hover:shadow-brutal-sm active:shadow-none active:translate-y-1'
          }`}
          aria-label="Go to first page"
        >
          <ChevronsLeft size={16} />
        </button>
        
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={`p-2 border-2 border-brutalism-black ${
            isFirstPage 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white hover:bg-brutalism-yellow/20 shadow-brutal-xs hover:shadow-brutal-sm active:shadow-none active:translate-y-1'
          }`}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} />
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className="px-3 py-1 text-sm"
              >
                ...
              </span>
            );
          }
          
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[40px] h-[40px] border-2 border-brutalism-black ${
                currentPage === page 
                  ? 'bg-brutalism-yellow text-black font-bold shadow-brutal-sm' 
                  : 'bg-white hover:bg-brutalism-yellow/20 shadow-brutal-xs hover:shadow-brutal-sm active:shadow-none active:translate-y-1'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={`p-2 border-2 border-brutalism-black ${
            isLastPage 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white hover:bg-brutalism-yellow/20 shadow-brutal-xs hover:shadow-brutal-sm active:shadow-none active:translate-y-1'
          }`}
          aria-label="Go to next page"
        >
          <ChevronRight size={16} />
        </button>
        
        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={isLastPage}
          className={`p-2 border-2 border-brutalism-black ${
            isLastPage 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white hover:bg-brutalism-yellow/20 shadow-brutal-xs hover:shadow-brutal-sm active:shadow-none active:translate-y-1'
          }`}
          aria-label="Go to last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination; 