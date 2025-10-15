"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, HelpCircle, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface Contact {
  name?: string;
  phone_number: string;
}

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (contacts: Contact[]) => void;
  onDownloadSample?: () => void;
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onDownloadSample,
}) => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Contact[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
        setSelectedFile(file);
        parseExcelFile(file);
      } else {
        alert("엑셀 파일만 업로드 가능합니다 (.xlsx, .xls, .csv)");
      }
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (jsonData.length < 2) {
          alert("엑셀 파일에 데이터가 없습니다");
          return;
        }

        // 첫 번째 행을 헤더로 처리
        const headers = jsonData[0].map(h => String(h).toLowerCase());
        const nameIndex = headers.findIndex(h =>
          h.includes('이름') || h.includes('name') || h.includes('성명')
        );
        const phoneIndex = headers.findIndex(h =>
          h.includes('전화') || h.includes('phone') || h.includes('연락처') || h.includes('번호')
        );

        if (phoneIndex === -1) {
          alert("전화번호 컬럼을 찾을 수 없습니다");
          return;
        }

        const contacts: Contact[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const phoneRaw = row[phoneIndex] ? String(row[phoneIndex]).replace(/-/g, '').trim() : '';

          if (/^01[0-9]{8,9}$/.test(phoneRaw)) {
            contacts.push({
              phone_number: phoneRaw,
              name: nameIndex >= 0 && row[nameIndex] ? String(row[nameIndex]).trim() : undefined
            });
          }
        }

        if (contacts.length === 0) {
          alert("유효한 전화번호가 없습니다");
          return;
        }

        setParsedContacts(contacts);
      } catch (error) {
        console.error("엑셀 파싱 오류:", error);
        alert("엑셀 파일 읽기에 실패했습니다");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
        setSelectedFile(file);
        parseExcelFile(file);
      } else {
        alert("엑셀 파일만 업로드 가능합니다 (.xlsx, .xls, .csv)");
      }
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadSample = () => {
    if (onDownloadSample) {
      onDownloadSample();
    } else {
      const sampleData = [
        {
          '이름': '홍길동',
          '전화번호': '01012345678'
        },
        {
          '이름': '김철수',
          '전화번호': '01087654321'
        },
        {
          '이름': '이영희',
          '전화번호': '01056781234'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '연락처');
      XLSX.writeFile(workbook, '연락처_샘플.xlsx');
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    let token = localStorage.getItem("accessToken");
    if (!token) return null;

    // 토큰 만료 확인 (간단한 체크)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;

      // 토큰이 만료되었거나 1분 이내 만료 예정이면 갱신
      if (Date.now() >= expiresAt - 60000) {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return null;

        const response = await fetch("/api/users/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("accessToken", data.accessToken);
          token = data.accessToken;
        } else {
          return null;
        }
      }
    } catch (error) {
      console.error("토큰 검증 오류:", error);
    }

    return token;
  };

  const handleConfirm = async () => {
    if (parsedContacts.length === 0) {
      return;
    }

    // 주소록 저장 기능이 활성화된 경우
    if (saveToAddressBook) {
      if (!groupName.trim()) {
        alert("주소록 이름을 입력해주세요");
        return;
      }

      try {
        const token = await getValidToken();
        if (!token) {
          alert("로그인이 필요합니다");
          return;
        }

        // 1. 그룹 생성
        const groupResponse = await fetch("/api/address-book/groups", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            group_name: groupName.trim()
          })
        });

        if (!groupResponse.ok) {
          alert("주소록 그룹 생성에 실패했습니다");
          return;
        }

        const { group } = await groupResponse.json();

        // 2. 연락처 일괄 추가 (중복 무시 처리)
        let successCount = 0;
        let duplicateCount = 0;

        for (const contact of parsedContacts) {
          try {
            const contactResponse = await fetch("/api/address-book/contacts", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                group_id: group.id,
                contacts: [contact]
              })
            });

            if (contactResponse.ok) {
              successCount++;
            } else {
              const errorData = await contactResponse.json();
              if (errorData.error?.code === '23505') {
                // 중복 연락처는 무시
                duplicateCount++;
              }
            }
          } catch (error) {
            console.error("연락처 추가 오류:", error);
          }
        }

        if (successCount > 0) {
          let message = `주소록 "${groupName.trim()}"에 ${successCount}개의 연락처가 추가되었습니다`;
          if (duplicateCount > 0) {
            message += `\n(${duplicateCount}개의 중복 연락처는 제외됨)`;
          }
          alert(message);
        } else if (duplicateCount > 0) {
          alert(`모든 연락처가 이미 주소록에 존재합니다 (${duplicateCount}개)`);
        } else {
          alert("연락처 추가에 실패했습니다");
          return;
        }
      } catch (error) {
        console.error("주소록 저장 오류:", error);
        alert("주소록 저장 중 오류가 발생했습니다");
        return;
      }
    }

    // 3. 수신자 목록에 추가
    onUpload(parsedContacts);

    // 초기화
    setSelectedFile(null);
    setParsedContacts([]);
    setSaveToAddressBook(false);
    setGroupName("");
    onClose();
  };

  const handleOpenPreview = () => {
    if (parsedContacts.length > 0) {
      setIsPreviewModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">수신자 목록에 연락처 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span className="font-medium">엑셀 파일 업로드 (csv, xls, xlsx)</span>
            </div>
            <button onClick={handleDownloadSample} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm w-full justify-center hover:bg-gray-50">
              <Download className="w-4 h-4" />
              예제파일 내려받기
            </button>
          </div>

          <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={"border-2 border-dashed rounded-lg p-12 text-center mb-4 " + (dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-gray-50")}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">엑셀 파일 업로드</p>
            <p className="text-sm text-gray-500 mb-3">
              이곳에 파일 끌어오기 혹은{" "}
              <button
                onClick={handleBrowse}
                className="text-purple-600 underline hover:text-purple-700"
              >
                찾아보기
              </button>
            </p>
            {selectedFile && (
              <div className="mt-4 p-3 bg-white border rounded text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB · {parsedContacts.length}개 연락처
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setParsedContacts([]);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>


          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={saveToAddressBook} onChange={(e) => setSaveToAddressBook(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span className="text-sm">주소록 생성 후 저장하기</span>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>

            {/* 주소록 이름 입력 (토글 활성화 시에만 표시) */}
            {saveToAddressBook && (
              <div>
                <label className="block text-sm font-medium mb-2">새로운 주소록 이름 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="주소록 이름을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={parsedContacts.length === 0}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                수신자 목록에 추가 ({parsedContacts.length})
              </button>
              <button
                onClick={handleOpenPreview}
                disabled={parsedContacts.length === 0}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                미리보기
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button onClick={() => router.push("/support?tab=contact")} className="px-4 py-2 text-gray-600 hover:text-gray-800">문의</button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">닫기</button>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">총 {parsedContacts.length}개 조회됨</h2>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between border-b bg-gray-50">
              <div className="text-sm text-gray-600">
                실패한 문자 <span className="text-red-500 font-semibold">0</span>개
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                  이전
                </button>
                <span className="px-3 py-1 text-xs">1 / 1</span>
                <button className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                  다음
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-16">번호</th>
                    <th className="p-2 text-left">전화번호(필수)</th>
                    <th className="p-2 text-left">이름(필수)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedContacts.map((contact, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{contact.phone_number}</td>
                      <td className="p-2">{contact.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <button
                onClick={() => router.push("/support?tab=contact")}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                문의
              </button>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUploadModal;