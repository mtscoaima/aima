"use client";

import React from 'react';
import Link from 'next/link';
import { TermType, TermsData, getTermsLabel } from '@/lib/termsService';

interface TermsLayoutProps {
  type: TermType;
  data: TermsData | null;
  loading: boolean;
  error: string | null;
}

const TermsLayout: React.FC<TermsLayoutProps> = ({ type, data, loading, error }) => {
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

    const formattedContent = processedSections.join('</p><p class="mb-4 text-gray-700 leading-relaxed">');

    return `<div class="prose max-w-none">
              <p class="mb-4 text-gray-700 leading-relaxed">${formattedContent}</p>
            </div>`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">약관을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">약관을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 약관을 찾을 수 없습니다.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 네비게이션 */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8 print:hidden">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            홈
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{getTermsLabel(type)}</span>
        </nav>

        {/* 헤더 */}
        <header className="mb-8 pb-8 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              버전 {data.version}
            </span>
            <span>최종 업데이트: {formatDate(data.updated_at)}</span>
          </div>
        </header>

        {/* 약관 내용 */}
        <main className="mb-12">
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h1:text-2xl prose-h1:mb-6 prose-h1:mt-8 first:prose-h1:mt-0 prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-6 prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-5 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-li:text-gray-700 prose-li:mb-2 prose-ol:mb-6 prose-ul:mb-6 prose-strong:text-gray-900 prose-strong:font-semibold prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:p-3 prose-th:text-left prose-td:border prose-td:border-gray-300 prose-td:p-3"
            dangerouslySetInnerHTML={{
              __html: `<div>${formatContent(data.content)}</div>`
            }}
          />
        </main>

        {/* 관련 약관 링크 */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg print:hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">관련 약관</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {type !== 'SERVICE_TERMS' && (
              <Link
                href="/terms"
                className="block p-4 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
              >
                <span className="text-blue-600 font-medium">서비스 이용약관</span>
              </Link>
            )}
            {type !== 'PRIVACY_POLICY' && (
              <Link
                href="/privacy"
                className="block p-4 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
              >
                <span className="text-blue-600 font-medium">개인정보처리방침</span>
              </Link>
            )}
          </div>
        </div>

        {/* 문의 정보 */}
        <div className="p-6 bg-blue-50 rounded-lg mb-8 print:hidden">
          <p className="text-gray-900 font-medium mb-3">이 약관에 대한 문의가 있으시면 고객센터로 연락해 주세요.</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2 text-gray-700">
              <span>📞</span>
              <span>070-8824-1139</span>
            </span>
            <span className="flex items-center gap-2 text-gray-700">
              <span>✉️</span>
              <span>aima@mtsco.co.kr</span>
            </span>
          </div>
        </div>

        {/* 인쇄 버튼 */}
        <div className="flex justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            aria-label="약관 인쇄"
          >
            <span>📄</span>
            <span>인쇄하기</span>
          </button>
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style jsx>{`
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }

          .prose h1 {
            page-break-after: avoid;
          }

          .prose h2, .prose h3 {
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          .prose p {
            page-break-inside: avoid;
            orphans: 2;
            widows: 2;
          }

          .prose table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default TermsLayout;