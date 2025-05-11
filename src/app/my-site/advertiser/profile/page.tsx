"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// 회원정보 데이터 타입
interface UserProfileData {
  // 개인 정보
  name: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  joinDate: string;
  lastLoginDate: string;
  
  // 기업 정보
  companyName: string;
  representativeName: string;
  businessNumber: string;
  address: string;
  phoneNumberCompany: string;
  customerServiceNumber: string;
  optOutNumber: string; // 080 수신거부 번호
  
  // SNS 연동 정보
  connectedSNS: {
    kakao: boolean;
    naver: boolean;
    google: boolean;
    [key: string]: boolean;
  };
  
  // 인덱스 시그니처 추가
  [key: string]: string | boolean | object;
}

// 각 섹션의 수정 상태 관리
interface EditState {
  personal: boolean;
  company: boolean;
  password: boolean;
}

export default function ProfilePage() {
  // 사용자 프로필 데이터 (샘플)
  const [userData, setUserData] = useState<UserProfileData>({
    name: '김솔라',
    email: 'solar@solarpi.com',
    phoneNumber: '010-1234-5678',
    position: '마케팅 담당자',
    department: '마케팅팀',
    joinDate: '2025-01-15',
    lastLoginDate: '2025-05-20 14:32:45',
    
    companyName: '솔라피 테크놀로지',
    representativeName: '김솔라',
    businessNumber: '123-45-67890',
    address: '서울특별시 강남구 테헤란로 123, 7층 701호',
    phoneNumberCompany: '02-1234-5678',
    customerServiceNumber: '1544-9876',
    optOutNumber: '080-123-4567',
    
    connectedSNS: {
      kakao: true,
      naver: false,
      google: true,
    }
  });
  
  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState<EditState>({
    personal: false,
    company: false,
    password: false
  });
  
  // 비밀번호 확인 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState<{show: boolean, section: keyof EditState | null}>({
    show: false, 
    section: null
  });
  
  // 비밀번호 입력 상태
  const [password, setPassword] = useState('');
  
  // 수정된 데이터
  const [editedData, setEditedData] = useState<UserProfileData>({...userData});
  
  // 비밀번호 모달 열기
  const openPasswordModal = (section: keyof EditState) => {
    setShowPasswordModal({show: true, section});
    setPassword('');
  };
  
  // 비밀번호 모달 닫기
  const closePasswordModal = () => {
    setShowPasswordModal({show: false, section: null});
  };
  
  // 비밀번호 검증 및 수정 모드 전환
  const verifyPasswordAndEdit = () => {
    // 실제 구현에서는 서버에 비밀번호 검증 요청
    // 여기서는 간단하게 아무 입력이나 받으면 통과
    if(showPasswordModal.section) {
      setIsEditing({
        ...isEditing,
        [showPasswordModal.section]: true
      });
    }
    closePasswordModal();
  };
  
  // 수정 취소
  const cancelEdit = (section: keyof EditState) => {
    setIsEditing({
      ...isEditing,
      [section]: false
    });
    setEditedData({...userData}); // 원래 데이터로 복원
  };
  
  // 수정 내용 저장
  const saveChanges = (section: keyof EditState) => {
    // 실제 구현에서는 서버에 수정된 정보 저장 요청
    setUserData({...editedData});
    setIsEditing({
      ...isEditing,
      [section]: false
    });
    alert('회원정보가 수정되었습니다.');
  };
  
  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // name에 '.'이 있으면 중첩된 객체 속성 (예: connectedSNS.kakao)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedData({
        ...editedData,
        [parent]: {
          ...editedData[parent] as Record<string, string | boolean>,
          [child]: value
        }
      });
    } else {
      setEditedData({
        ...editedData,
        [name]: value
      });
    }
  };
  
  // SNS 연결/해제 핸들러
  const handleSNSConnection = (snsName: 'kakao' | 'naver' | 'google', connect: boolean) => {
    // 실제 구현에서는 SNS 연결/해제 API 호출
    setUserData({
      ...userData,
      connectedSNS: {
        ...userData.connectedSNS,
        [snsName]: connect
      }
    });
    
    if (connect) {
      alert(`${snsName} 계정이 연결되었습니다.`);
    } else {
      alert(`${snsName} 계정 연결이 해제되었습니다.`);
    }
  };
  
  // 회원 탈퇴 핸들러
  const handleAccountDeletion = () => {
    const confirmed = window.confirm('정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (confirmed) {
      // 실제 구현에서는 회원 탈퇴 API 호출
      alert('회원 탈퇴가 처리되었습니다.');
      // 로그아웃 및 홈페이지로 리디렉션
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">회원정보 관리</h1>
      </div>
      
      {/* 개인 정보 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-blue-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">개인 정보</h2>
          {!isEditing.personal ? (
            <button 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              onClick={() => openPasswordModal('personal')}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              정보 수정
            </button>
          ) : (
            <div className="flex space-x-2">
              <button 
                className="text-green-600 hover:text-green-800 text-sm font-medium"
                onClick={() => saveChanges('personal')}
              >
                저장
              </button>
              <button 
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                onClick={() => cancelEdit('personal')}
              >
                취소
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">이름</p>
            {isEditing.personal ? (
              <input
                type="text"
                name="name"
                value={editedData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.name}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">이메일</p>
            <p className="font-medium">{userData.email}</p>
            <p className="text-xs text-gray-500 mt-1">(이메일은 변경할 수 없습니다. 고객센터에 문의하세요.)</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">휴대폰 번호</p>
            {isEditing.personal ? (
              <input
                type="text"
                name="phoneNumber"
                value={editedData.phoneNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.phoneNumber}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">직책</p>
            {isEditing.personal ? (
              <input
                type="text"
                name="position"
                value={editedData.position}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.position}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">부서</p>
            {isEditing.personal ? (
              <input
                type="text"
                name="department"
                value={editedData.department}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.department}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">가입일</p>
            <p className="font-medium">{userData.joinDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">최근 로그인</p>
            <p className="font-medium">{userData.lastLoginDate}</p>
          </div>
        </div>
      </div>
      
      {/* 기업 정보 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-green-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">기업 정보</h2>
          {!isEditing.company ? (
            <button 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              onClick={() => openPasswordModal('company')}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              정보 수정
            </button>
          ) : (
            <div className="flex space-x-2">
              <button 
                className="text-green-600 hover:text-green-800 text-sm font-medium"
                onClick={() => saveChanges('company')}
              >
                저장
              </button>
              <button 
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                onClick={() => cancelEdit('company')}
              >
                취소
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">기업명</p>
            {isEditing.company ? (
              <input
                type="text"
                name="companyName"
                value={editedData.companyName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.companyName}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">대표자명</p>
            {isEditing.company ? (
              <input
                type="text"
                name="representativeName"
                value={editedData.representativeName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.representativeName}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">사업자등록번호</p>
            <p className="font-medium">{userData.businessNumber}</p>
            <p className="text-xs text-gray-500 mt-1">(사업자등록번호는 변경할 수 없습니다. 고객센터에 문의하세요.)</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">주소</p>
            {isEditing.company ? (
              <input
                type="text"
                name="address"
                value={editedData.address}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.address}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">대표번호</p>
            {isEditing.company ? (
              <input
                type="text"
                name="phoneNumberCompany"
                value={editedData.phoneNumberCompany}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.phoneNumberCompany}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">고객센터 번호</p>
            {isEditing.company ? (
              <input
                type="text"
                name="customerServiceNumber"
                value={editedData.customerServiceNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.customerServiceNumber}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">080 수신거부 번호</p>
            {isEditing.company ? (
              <input
                type="text"
                name="optOutNumber"
                value={editedData.optOutNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            ) : (
              <p className="font-medium">{userData.optOutNumber}</p>
            )}
          </div>
          <div>
            <Link href="/my-site/advertiser/company-verification" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              기업정보인증 상태 확인하기 →
            </Link>
          </div>
        </div>
      </div>
      
      {/* 비밀번호 변경 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-purple-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">비밀번호 관리</h2>
          {!isEditing.password ? (
            <button 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              onClick={() => openPasswordModal('password')}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              비밀번호 변경
            </button>
          ) : (
            <div className="flex space-x-2">
              <button 
                className="text-green-600 hover:text-green-800 text-sm font-medium"
                onClick={() => saveChanges('password')}
              >
                저장
              </button>
              <button 
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                onClick={() => cancelEdit('password')}
              >
                취소
              </button>
            </div>
          )}
        </div>
        {!isEditing.password ? (
          <p className="text-sm text-gray-600">보안을 위해 비밀번호는 주기적으로 변경해주세요.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm text-gray-600">현재 비밀번호</label>
              <input
                type="password"
                id="currentPassword"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm text-gray-600">새 비밀번호</label>
              <input
                type="password"
                id="newPassword"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">영문, 숫자, 특수문자 조합 8-20자</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-600">새 비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* SNS 연동 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">SNS 계정 연동</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold">K</span>
              </div>
              <span className="font-medium">카카오 계정</span>
            </div>
            {userData.connectedSNS.kakao ? (
              <button 
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                onClick={() => handleSNSConnection('kakao', false)}
              >
                연결 해제
              </button>
            ) : (
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={() => handleSNSConnection('kakao', true)}
              >
                연결하기
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="font-medium">네이버 계정</span>
            </div>
            {userData.connectedSNS.naver ? (
              <button 
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                onClick={() => handleSNSConnection('naver', false)}
              >
                연결 해제
              </button>
            ) : (
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={() => handleSNSConnection('naver', true)}
              >
                연결하기
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold">G</span>
              </div>
              <span className="font-medium">구글 계정</span>
            </div>
            {userData.connectedSNS.google ? (
              <button 
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                onClick={() => handleSNSConnection('google', false)}
              >
                연결 해제
              </button>
            ) : (
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={() => handleSNSConnection('google', true)}
              >
                연결하기
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 회원 탈퇴 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">회원 탈퇴</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 mb-4">
            회원 탈퇴 시 모든 계정 정보와 서비스 이용 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <button 
            className="text-red-600 hover:text-red-800 text-sm font-medium"
            onClick={handleAccountDeletion}
          >
            회원 탈퇴하기
          </button>
        </div>
      </div>
      
      {/* 비밀번호 확인 모달 */}
      {showPasswordModal.show && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closePasswordModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      비밀번호 확인
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        회원님의 정보 보호를 위해 비밀번호를 다시 확인합니다.
                      </p>
                      <div className="mt-4">
                        <input
                          type="password"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="비밀번호 입력"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={verifyPasswordAndEdit}
                >
                  확인
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closePasswordModal}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 