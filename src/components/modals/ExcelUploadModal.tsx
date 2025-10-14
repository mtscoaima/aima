"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, HelpCircle, BookOpen } from "lucide-react";

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onDownloadSample?: () => void;
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onDownloadSample,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
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
      } else {
        alert("엑셀 파일만 업로드 가능합니다 (.xlsx, .xls, .csv)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        alert("엑셀 파일만 업로드 가능합니다 (.xlsx, .xls, .csv)");
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadSample = () => {
    if (onDownloadSample) {
      onDownloadSample();
    } else {
      alert("샘플 파일 다운로드 기능은 준비 중입니다.");
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      setSaveToAddressBook(false);
      onClose();
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
            <p className="text-sm text-gray-500">이곳에 파일 끌어오기 혹은 찾아보기</p>
            {selectedFile && (
              <div className="mt-4 p-3 bg-white border rounded text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</div>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700">
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

            <div className="flex gap-2">
              <button onClick={handleConfirm} disabled={!selectedFile} className="w-full px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                수신자 목록에 추가
              </button>
              <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                미리보기
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800">채팅 문의</button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">닫기</button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;