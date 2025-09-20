"use client";

import React from "react";
import { useTermsContent } from "@/hooks/useTermsContent";
import { TermType } from "@/lib/termsService";

export type TermsType = "service" | "privacy" | "marketing";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TermsType;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  // TermsType을 TermType으로 변환
  const getTermType = (type: TermsType): TermType => {
    switch (type) {
      case "service":
        return "SERVICE_TERMS";
      case "privacy":
        return "PRIVACY_POLICY";
      case "marketing":
        return "MARKETING_CONSENT";
      default:
        return "SERVICE_TERMS";
    }
  };

  const termType = getTermType(type);
  const { data, loading, error } = useTermsContent(termType);

  if (!isOpen) return null;

    // Markdown을 HTML로 변환하는 함수 (표와 리스트 지원)
  const formatContent = (content: string) => {
    // 텍스트를 빈 줄로 분할하여 각 섹션을 처리
    const sections = content.split(/\n\s*\n/);

    const processedSections = sections.map(section => {
      let formattedSection = section;

      // 제목 처리를 먼저 수행 (테이블 처리 전에)
      formattedSection = formattedSection
        .replace(/^###\s*(\d+)\.\s*(.+)$/gm, '<h3 class="text-lg font-semibold mb-3 mt-12 text-blue-700">$1. $2</h3>')
        .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mb-6 mt-8 first:mt-0 text-gray-900">$1</h1>')
        .replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-bold mb-2 mt-6 text-gray-800">$1</h2>');

      // 이 섹션에 테이블이 있는지 확인
      if (formattedSection.includes('|') && formattedSection.includes('---')) {
                        // 테이블 처리 - 단순한 colspan 지원
        formattedSection = formattedSection.replace(
          /\|(.+)\|\s*\n\|[-\s|:]+\|\s*\n((?:\|.*\|\s*\n?)*)/gm,
          (match: string, header: string, rows: string) => {
            // 헤더 처리
            const headerCells = header.split('|').map((cell: string) => cell.trim());
            // 첫 번째와 마지막 빈 요소 제거 (| 시작/끝 때문에 생기는)
            if (headerCells[0] === '') headerCells.shift();
            if (headerCells[headerCells.length - 1] === '') headerCells.pop();

            // 바디 행 처리
            const bodyRowsData = rows.trim().split(/\n/).map((row: string) => {
              if (!row.trim() || !row.includes('|')) return null;

              const cells = row.split('|');
              // 첫 번째와 마지막 빈 요소 제거 (| 시작/끝 때문에 생기는)
              if (cells[0] === '') cells.shift();
              if (cells[cells.length - 1] === '') cells.pop();

              return cells.map((cell: string) => cell.trim());
            }).filter(row => row !== null);

            if (bodyRowsData.length === 0) return '';

            // 최대 컬럼 수 계산 (모든 행 중 가장 많은 컬럼 수 기준)
            const maxCols = Math.max(headerCells.length, ...bodyRowsData.map(row => row.length));

            // 헤더에서 빈 셀이 아닌 셀들만 렌더링
            const nonEmptyHeaderCells = headerCells.filter(cell => cell !== '');
            // 헤더가 1개일 때만 전체 테이블 너비를 차지하도록 colspan 계산
            const headerColspan = nonEmptyHeaderCells.length === 1 ? maxCols : Math.floor(maxCols / nonEmptyHeaderCells.length);
            const headerRow = `<tr>${nonEmptyHeaderCells.map((cell: string) => `<th class="border border-gray-300 bg-gray-50 p-3 text-center font-semibold" colspan="${headerColspan}">${cell}</th>`).join('')}</tr>`;

            // HTML 생성
            const processedRows: string[] = [];

            for (let row = 0; row < bodyRowsData.length; row++) {
              const cellsHtml: string[] = [];

              // 현재 행에서 빈 셀이 아닌 실제 데이터가 있는 셀들만 계산
              const nonEmptyCells = bodyRowsData[row].filter(cell => cell && cell.trim() !== '');
              const actualCellCount = nonEmptyCells.length;

              // 각 셀에 적용할 colspan 계산
              const baseColspan = actualCellCount > 0 ? Math.floor(maxCols / actualCellCount) : 1;
              const remainder = actualCellCount > 0 ? maxCols % actualCellCount : 0;

              let cellIndex = 0;
              for (let col = 0; col < bodyRowsData[row].length; col++) {
                const cellValue = bodyRowsData[row][col] || '';

                // 빈 셀은 건너뛰기
                if (!cellValue || cellValue.trim() === '') continue;

                const cellClass = "border border-gray-300 p-3 text-left";

                // colspan 계산 - 마지막 셀은 남은 공간을 모두 차지
                let cellColspan = baseColspan;
                if (cellIndex === actualCellCount - 1) {
                  cellColspan += remainder;
                }

                // 셀 생성 (rowspan 제거)
                let cellAttributes = `class="${cellClass}"`;
                if (cellColspan > 1) cellAttributes += ` colspan="${cellColspan}"`;

                cellsHtml.push(`<td ${cellAttributes}>${cellValue}</td>`);
                cellIndex++;
              }

              if (cellsHtml.length > 0) {
                processedRows.push(`<tr>${cellsHtml.join('')}</tr>`);
              }
            }

            const bodyRows = processedRows.join('');

            return `<table class="table-auto w-full border-collapse border border-gray-300 my-6">
                      <thead class="bg-gray-50">${headerRow}</thead>
                      <tbody>${bodyRows}</tbody>
                    </table>`;
          }
        );
      }

      // 번호 있는 리스트 처리
      formattedSection = formattedSection.replace(
        /^(\d+)\) (.+)$/gm,
        '<div class="mb-3 mt-3"><span class="font-medium text-gray-700">$1)</span> $2</div>'
      );

      // 일반 번호 리스트
      formattedSection = formattedSection.replace(
        /^(\d+)\. (.+)$/gm,
        '<div class="mb-3 mt-3 pl-2"><span class="font-semibold text-gray-800">$1.</span> $2</div>'
      );

      // 일반 리스트 처리 (- 형태)
      formattedSection = formattedSection.replace(
        /^- (.+)$/gm,
        '<div class="mb-2 mt-2 pl-4"><span class="text-gray-600">•</span> <span class="ml-2 text-gray-700">$1</span></div>'
      );

      // 강조 텍스트
      formattedSection = formattedSection.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

      return formattedSection;
    });

    const formattedContent = processedSections.join('</p><p class="mb-2 text-gray-700 leading-relaxed">');

    return `<div class="prose max-w-none">
              <p class="mb-2 text-gray-700 leading-relaxed">${formattedContent}</p>
            </div>`;
  };

  const getTermsContent = () => {
    if (loading) {
      return {
        title: "로딩 중...",
        content: (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">약관을 불러오는 중...</span>
          </div>
        ),
      };
    }

    if (error || !data) {
      return {
        title: "오류",
        content: (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || "약관을 불러올 수 없습니다."}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              다시 시도
            </button>
          </div>
        ),
      };
    }

    return {
      title: data.title,
      content: (
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h1:text-2xl prose-h1:mb-6 prose-h1:mt-8 first:prose-h1:mt-0 prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-6 prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-5 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-li:text-gray-700 prose-li:mb-2 prose-ol:mb-6 prose-ul:mb-6 prose-strong:text-gray-900 prose-strong:font-semibold prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:p-3 prose-th:text-left prose-td:border prose-td:border-gray-300 prose-td:p-3">
          <div dangerouslySetInnerHTML={{
            __html: `<div>${formatContent(data.content)}</div>`
          }} />
        </div>
      ),
    };
  };

  const { title, content } = getTermsContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>

        <div className="border-t border-gray-200 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;