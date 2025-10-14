"use client";

import React, { useState } from "react";
import { X, Search, Plus, Upload, Trash2 } from "lucide-react";

interface Contact {
  id?: number;
  name: string;
  phone_number: string;
  group_name?: string;
}

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contacts: Contact[]) => void;
}

const AddressBookModal: React.FC<AddressBookModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  if (!isOpen) return null;

  const mockGroups: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConfirm = () => {
    onSelect(selectedContacts);
    setSelectedContacts([]);
    setSelectedGroups([]);
    setSearchQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold">수신자 목록에 연락처 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 flex flex-col">
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                  <Plus className="w-4 h-4" />
                  새 그룹
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                  <Upload className="w-4 h-4" />
                  엑셀 업로드
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-400 rounded text-sm cursor-not-allowed" disabled>
                  <Trash2 className="w-4 h-4" />
                  그룹 삭제
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="그룹명 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {mockGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-base mb-1">조회된 연락처 그룹이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mockGroups.map((group, index) => (
                    <div key={index} className="p-3 bg-white rounded hover:bg-gray-50 cursor-pointer">
                      {group}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pb-3 bg-white flex justify-between">
              <p className="text-sm text-gray-600">그룹 {selectedGroups.length}개 선택됨</p>
              <p className="text-xs text-gray-500 mt-1">그룹 이름을 우클릭하여 그룹을 관리할 수 있습니다</p>
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-gray-300 border-b flex items-center justify-between">
              <span className="text-sm font-medium">추가한 수신번호 (총 {selectedContacts.length}개)</span>
              <button className="px-3 py-1 text-sm text-gray-400 cursor-not-allowed" disabled>
                비우기
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedContacts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">수신자명단이 비어있습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedContacts.map((contact, index) => (
                    <div key={index} className="p-3 bg-gray-50 border rounded">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.phone_number}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-300 bg-gray-50">
          <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed" disabled>
            수신자 명단에 추가
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
            채팅 문의
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressBookModal;