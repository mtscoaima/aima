"use client";

import React, { useState } from 'react';

// 기업정보 인증 상태 타입
type VerificationStatus = 'waiting' | 'processing' | 'approved' | 'rejected';

// 기업정보 인증 상태 데이터 타입
interface BusinessVerificationData {
  status: VerificationStatus;
  companyName: string;
  representativeName: string;
  address: string;
  phoneNumber: string;
  customerServiceNumber: string;
  optOutNumber: string; // 080 수신거부 번호
  submittedAt: string;
  respondedAt?: string;
  rejectionReason?: string;
  documents: {
    businessRegistration: {
      status: 'submitted' | 'approved' | 'rejected';
      fileName: string;
      submittedAt: string;
    };
    employmentCertificate?: {
      status: 'submitted' | 'approved' | 'rejected';
      fileName: string;
      submittedAt: string;
    };
  };
  taxInvoiceInfo: {
    email: string;
    managerName: string;
    contactNumber: string;
  };
}

export default function BusinessVerificationPage() {
  // 실제 애플리케이션에서는 API로부터 데이터를 가져올 것입니다
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [verificationData, setVerificationData] = useState<BusinessVerificationData>({
    status: 'processing',
    companyName: '솔라피 테크놀로지',
    representativeName: '김솔라',
    address: '서울특별시 강남구 테헤란로 123, 7층 701호',
    phoneNumber: '02-1234-5678',
    customerServiceNumber: '1544-9876',
    optOutNumber: '080-123-4567',
    submittedAt: '2025-05-01 14:23:45',
    documents: {
      businessRegistration: {
        status: 'approved',
        fileName: '사업자등록증_솔라피테크놀로지.pdf',
        submittedAt: '2025-05-01 14:23:45',
      },
      employmentCertificate: {
        status: 'rejected',
        fileName: '재직증명서_김솔라.pdf',
        submittedAt: '2025-05-01 14:23:45',
      },
    },
    taxInvoiceInfo: {
      email: 'tax@solarpi.com',
      managerName: '정재무',
      contactNumber: '010-9876-5432',
    },
  });

  // 인증 상태에 따른 배지 스타일
  const getStatusBadgeStyle = (status: VerificationStatus) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 인증 상태를 한글로 표시
  const getStatusText = (status: VerificationStatus) => {
    switch (status) {
      case 'waiting':
        return '대기중';
      case 'processing':
        return '처리중';
      case 'approved':
        return '승인완료';
      case 'rejected':
        return '반려';
      default:
        return '알 수 없음';
    }
  };

  // 문서 상태에 따른 배지 스타일
  const getDocumentStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 문서 상태를 한글로 표시
  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return '제출됨';
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '반려됨';
      default:
        return '알 수 없음';
    }
  };

  // 서류 재제출 핸들러
  const handleReupload = (documentType: string) => {
    alert(`${documentType} 서류를 재제출합니다.`);
    // 실제 구현에서는 파일 업로드 로직이 들어갑니다
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">기업정보 인증 상태</h1>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(verificationData.status)}`}>
          {getStatusText(verificationData.status)}
        </div>
      </div>

      {/* 반려 사유 표시 (반려 상태인 경우에만) */}
      {verificationData.status === 'rejected' && verificationData.rejectionReason && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">반려 사유</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{verificationData.rejectionReason}</p>
              </div>
              <div className="mt-4">
                <button 
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  재제출하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 기본 기업 정보 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-blue-500">
        <h2 className="text-lg font-semibold mb-4">기업 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">기업명</p>
            <p className="font-medium">{verificationData.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">대표자명</p>
            <p className="font-medium">{verificationData.representativeName}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">주소</p>
            <p className="font-medium">{verificationData.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">대표번호</p>
            <p className="font-medium">{verificationData.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">고객센터 번호</p>
            <p className="font-medium">{verificationData.customerServiceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">080 수신거부 번호</p>
            <p className="font-medium">{verificationData.optOutNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">최초 제출일</p>
            <p className="font-medium">{verificationData.submittedAt}</p>
          </div>
        </div>
        <div className="mt-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            기업 정보 수정
          </button>
        </div>
      </div>

      {/* 제출 서류 정보 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-green-500">
        <h2 className="text-lg font-semibold mb-4">제출 서류</h2>
        <div className="space-y-4">
          {/* 사업자등록증 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="flex items-center">
                <span className="text-gray-800 font-medium">사업자등록증</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getDocumentStatusBadgeStyle(verificationData.documents.businessRegistration.status)}`}>
                  {getDocumentStatusText(verificationData.documents.businessRegistration.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">파일명: {verificationData.documents.businessRegistration.fileName}</p>
              <p className="text-sm text-gray-600">제출일: {verificationData.documents.businessRegistration.submittedAt}</p>
            </div>
            <div className="mt-2 md:mt-0">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                다운로드
              </button>
              {verificationData.documents.businessRegistration.status === 'rejected' && (
                <button 
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => handleReupload('사업자등록증')}
                >
                  재제출
                </button>
              )}
            </div>
          </div>

          {/* 재직증명서 */}
          {verificationData.documents.employmentCertificate && (
            <div className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="flex items-center">
                  <span className="text-gray-800 font-medium">재직증명서</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getDocumentStatusBadgeStyle(verificationData.documents.employmentCertificate.status)}`}>
                    {getDocumentStatusText(verificationData.documents.employmentCertificate.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">파일명: {verificationData.documents.employmentCertificate.fileName}</p>
                <p className="text-sm text-gray-600">제출일: {verificationData.documents.employmentCertificate.submittedAt}</p>
              </div>
              <div className="mt-2 md:mt-0">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                  다운로드
                </button>
                {verificationData.documents.employmentCertificate.status === 'rejected' && (
                  <button 
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    onClick={() => handleReupload('재직증명서')}
                  >
                    재제출
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 새 서류 업로드 버튼 */}
          <div className="flex justify-end mt-4">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              새 서류 업로드
            </button>
          </div>
        </div>
      </div>

      {/* 세금계산서 수령자 정보 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-purple-500">
        <h2 className="text-lg font-semibold mb-4">세금계산서 수령자 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">수신 이메일</p>
            <p className="font-medium">{verificationData.taxInvoiceInfo.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">담당자명</p>
            <p className="font-medium">{verificationData.taxInvoiceInfo.managerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">연락처</p>
            <p className="font-medium">{verificationData.taxInvoiceInfo.contactNumber}</p>
          </div>
        </div>
        <div className="mt-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            세금계산서 수령자 정보 수정
          </button>
        </div>
      </div>

      {/* 인증 절차 안내 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-gray-500">
        <h2 className="text-lg font-semibold mb-4">인증 절차 안내</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. 기업정보와 필요 서류를 제출합니다.</p>
          <p>2. 담당자 확인 후 처리가 진행됩니다. (영업일 기준 1-2일 소요)</p>
          <p>3. 승인이 완료되면 모든 서비스를 이용하실 수 있습니다.</p>
          <p>4. 반려 시 사유를 확인하고 필요한 문서를 재제출해주세요.</p>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>참고:</strong> 인증 처리 문의는 고객센터 (1544-9876)로 연락주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
} 