import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className = "",
}) => {
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const actualTotalPages = Math.max(1, totalPages); // 최소 1페이지 보장

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(actualTotalPages, startPage + maxVisiblePages - 1);

    // 끝 페이지 조정
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  // 페이지네이션 항상 표시 (주석처리)
  // if (totalPages <= 1) return null;

  return (
    <div className={`pagination-container ${className}`}>
      <div className="pagination-controls">
        <button
          className="pagination-button pagination-prev"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="첫 페이지"
        >
          ««
        </button>

        <button
          className="pagination-button pagination-prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="이전 페이지"
        >
          ‹
        </button>

        {getPageNumbers().map((pageNumber) => (
          <button
            key={pageNumber}
            className={`pagination-button pagination-number ${
              pageNumber === currentPage ? "active" : ""
            }`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        <button
          className="pagination-button pagination-next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === Math.max(1, totalPages)}
          title="다음 페이지"
        >
          ›
        </button>

        <button
          className="pagination-button pagination-next"
          onClick={() => onPageChange(Math.max(1, totalPages))}
          disabled={currentPage === Math.max(1, totalPages)}
          title="마지막 페이지"
        >
          »»
        </button>
      </div>
    </div>
  );
};

export default Pagination;
