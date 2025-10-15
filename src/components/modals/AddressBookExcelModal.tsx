"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface Contact {
  name?: string;
  phone_number: string;
}

interface AddressBookExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groupName: string, contacts: Contact[]) => void;
}

const AddressBookExcelModal: React.FC<AddressBookExcelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Contact[]>([]);
  const [groupName, setGroupName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
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
        setShowPreview(true);
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

  const handleDownloadSample = () => {
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
  };

  const handleConfirm = () => {
    if (!groupName.trim()) {
      alert("새로운 주소록 이름을 입력해주세요");
      return;
    }

    if (parsedContacts.length === 0) {
      alert("연락처 데이터가 없습니다");
      return;
    }

    onConfirm(groupName.trim(), parsedContacts);

    // 초기화
    setSelectedFile(null);
    setParsedContacts([]);
    setGroupName("");
    setShowPreview(false);
    onClose();
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">새 주소록 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 엑셀 파일 업로드 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <span className="text-green-600 text-lg">📊</span>
              </div>
              <span className="font-medium">엑셀 파일 업로드 (csv, xls, xlsx)</span>
            </div>

            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm w-full justify-center hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              예제파일 내려받기
            </button>
          </div>

          {/* 파일 드래그앤드롭 영역 */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
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
                      setShowPreview(false);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 미리보기 */}
          {showPreview && parsedContacts.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
              <h3 className="font-medium mb-2">미리보기 ({parsedContacts.length}개)</h3>
              <div className="space-y-2">
                {parsedContacts.slice(0, 5).map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                    <span className="font-medium">{contact.name || '이름 없음'}</span>
                    <span className="text-gray-600">{contact.phone_number}</span>
                  </div>
                ))}
                {parsedContacts.length > 5 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    외 {parsedContacts.length - 5}개
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 주소록 이름 입력 */}
          <div>
            <label className="block text-sm font-medium mb-2">새로운 주소록 이름</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="주소록 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={!groupName.trim() || parsedContacts.length === 0}
              className="flex-1 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              새 주소록 그룹 생성
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              disabled={parsedContacts.length === 0}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              미리보기
            </button>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="flex items-center justify-end gap-4 p-4 border-t bg-gray-50 text-sm">
          <button
            onClick={() => router.push("/support?tab=contact")}
            className="text-gray-600 hover:text-gray-800"
          >
            문의
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressBookExcelModal;
