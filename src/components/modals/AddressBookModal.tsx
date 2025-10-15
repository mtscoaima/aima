"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Plus, Upload, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import CreateGroupModal from "./CreateGroupModal";
import AddressBookExcelModal from "./AddressBookExcelModal";
import AddContactModal from "./AddContactModal";

interface Contact {
  id?: number;
  name?: string;
  phone_number: string;
  group_name?: string;
  custom_data?: Record<string, string>;
}

interface Group {
  id: number;
  group_name: string;
  description?: string;
  custom_fields?: CustomField[];
}

interface CustomField {
  label: string;
  example: string;
}

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contacts: Contact[]) => void;
  currentRecipients: Contact[]; // 현재 MessageSendTab에 추가된 수신번호 목록
  onClearRecipients?: () => void; // 수신번호 전체 비우기 콜백
}

const AddressBookModal: React.FC<AddressBookModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentRecipients,
  onClearRecipients,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactSearchQuery, setContactSearchQuery] = useState(""); // 연락처 검색
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]); // 체크박스로 선택한 연락처
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // 그룹 목록 조회
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  // 선택된 그룹의 연락처 조회
  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupContacts(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch("/api/address-book/groups", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("그룹 조회 오류:", error);
    }
  };

  const fetchGroupContacts = async (groupId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`/api/address-book/contacts?groupId=${groupId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroupContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("연락처 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupClick = (group: Group) => {
    setSelectedGroupId(group.id);
    setSelectedGroup(group);
  };

  const handleContactToggle = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`${selectedContacts.length}개의 연락처를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // 각 연락처 삭제 (병렬 처리)
      const deletePromises = selectedContacts.map(contact =>
        fetch(`/api/address-book/contacts?id=${contact.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        })
      );

      await Promise.all(deletePromises);

      alert("삭제되었습니다");
      setSelectedContacts([]);
      if (selectedGroupId) {
        fetchGroupContacts(selectedGroupId);  // 목록 갱신
      }
    } catch (error) {
      console.error("연락처 삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다");
    }
  };

  const handleExportExcel = () => {
    if (groupContacts.length === 0) {
      alert("내보낼 연락처가 없습니다");
      return;
    }

    // 엑셀 데이터 구성
    const data = groupContacts.map(contact => {
      const customData = typeof contact.custom_data === 'object' ? contact.custom_data : {};
      const row: Record<string, string> = {
        '이름': contact.name || '',
        '전화번호': contact.phone_number
      };

      // 확장 필드 추가
      if (selectedGroup?.custom_fields) {
        selectedGroup.custom_fields.forEach(field => {
          row[field.label] = customData[field.label] || '';
        });
      }

      return row;
    });

    // 엑셀 파일 생성
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '연락처');

    // 파일명 생성 (그룹명 + 날짜)
    const groupName = selectedGroup?.group_name || '연락처';
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${groupName}_${timestamp}.xlsx`);
  };

  const handleClearAllContacts = async () => {
    if (!selectedGroupId) {
      return;
    }

    if (!confirm(`"${selectedGroup?.group_name}" 그룹의 모든 연락처(${groupContacts.length}개)를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // 모든 연락처 삭제 (병렬 처리)
      const deletePromises = groupContacts.map(contact =>
        fetch(`/api/address-book/contacts?id=${contact.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        })
      );

      await Promise.all(deletePromises);

      alert("그룹의 모든 연락처가 삭제되었습니다");
      setSelectedContacts([]);
      fetchGroupContacts(selectedGroupId);  // 목록 갱신
    } catch (error) {
      console.error("연락처 삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다");
    }
  };

  const handleCreateGroup = async (groupName: string, customFields: CustomField[]) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch("/api/address-book/groups", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          group_name: groupName,
          description: customFields.length > 0 ? `확장 필드: ${customFields.map(f => f.label).join(', ')}` : null,
          custom_fields: customFields
        })
      });

      if (response.ok) {
        alert("그룹이 생성되었습니다");
        fetchGroups(); // 그룹 목록 갱신
      } else {
        alert("그룹 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("그룹 생성 오류:", error);
      alert("그룹 생성 중 오류가 발생했습니다");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId) {
      alert("삭제할 그룹을 선택해주세요");
      return;
    }

    if (!confirm(`"${selectedGroup?.group_name}" 그룹을 삭제하시겠습니까?\n그룹 내 모든 연락처도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`/api/address-book/groups/${selectedGroupId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("그룹이 삭제되었습니다");
        setSelectedGroupId(null);
        setSelectedGroup(null);
        setGroupContacts([]);
        setSelectedContacts([]);
        fetchGroups();
      } else {
        const data = await response.json();
        alert(data.error || "그룹 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("그룹 삭제 오류:", error);
      alert("그룹 삭제 중 오류가 발생했습니다");
    }
  };

  const handleAddContact = async (contact: {
    name: string;
    phone_number: string;
    custom_data: Record<string, string>;
  }) => {
    if (!selectedGroupId) {
      alert("그룹을 먼저 선택해주세요");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch("/api/address-book/contacts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          group_id: selectedGroupId,
          contacts: [{
            name: contact.name,
            phone_number: contact.phone_number,
            custom_data: contact.custom_data
          }]
        })
      });

      if (response.ok) {
        alert("연락처가 추가되었습니다");
        fetchGroupContacts(selectedGroupId); // 연락처 목록 갱신
      } else {
        alert("연락처 추가에 실패했습니다");
      }
    } catch (error) {
      console.error("연락처 추가 오류:", error);
      alert("연락처 추가 중 오류가 발생했습니다");
    }
  };

  const handleExcelUpload = async (groupName: string, contacts: Contact[]) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // 1. 그룹 생성
      const groupResponse = await fetch("/api/address-book/groups", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          group_name: groupName
        })
      });

      if (!groupResponse.ok) {
        alert("그룹 생성에 실패했습니다");
        return;
      }

      const { group } = await groupResponse.json();

      // 2. 연락처 추가
      const contactResponse = await fetch("/api/address-book/contacts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          group_id: group.id,
          contacts: contacts
        })
      });

      if (contactResponse.ok) {
        alert(`${contacts.length}개의 연락처가 추가되었습니다`);
        fetchGroups(); // 그룹 목록 갱신
      } else {
        alert("연락처 추가에 실패했습니다");
      }
    } catch (error) {
      console.error("엑셀 업로드 오류:", error);
      alert("업로드 중 오류가 발생했습니다");
    }
  };

  if (!isOpen) return null;

  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = groupContacts.filter(contact => {
    if (!contactSearchQuery) return true;
    const query = contactSearchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.phone_number.includes(query)
    );
  });

  const handleConfirm = () => {
    onSelect(selectedContacts);
    setSelectedContacts([]);
    setSelectedGroupId(null);
    setGroupContacts([]);
    setSearchQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl mx-4 h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold">수신자 목록에 연락처 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 좌측: 그룹 목록 */}
          <div className="w-1/3 flex flex-col border-r">
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  새 그룹
                </button>
                <button
                  onClick={() => setIsExcelModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  <Upload className="w-4 h-4" />
                  엑셀 업로드
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={!selectedGroupId}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                    selectedGroupId
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
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
              {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-base mb-1">조회된 연락처 그룹이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupClick(group)}
                      className={`p-3 bg-white rounded hover:bg-gray-50 cursor-pointer ${
                        selectedGroupId === group.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      <div className="font-medium">{group.group_name}</div>
                      {group.description && (
                        <div className="text-xs text-gray-500 mt-1">{group.description}</div>
                      )}
                      {group.custom_fields && group.custom_fields.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {group.custom_fields.map((field, index) => (
                            <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {field.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t">
              <p className="text-sm text-gray-600">그룹 {selectedGroupId ? 1 : 0}개 선택됨</p>
            </div>
          </div>

          {/* 중앙: 연락처 목록 (그룹 선택 시에만 표시) */}
          {selectedGroupId && (
            <div className="w-1/3 flex flex-col border-r">
              {/* 헤더 */}
              <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">
                    {selectedGroup?.group_name || '그룹'} &gt; 연락처 목록
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => {
                      if (groupContacts.length > 0) {
                        onSelect(groupContacts);
                        alert(`${groupContacts.length}개의 연락처를 수신자 명단에 추가했습니다.`);
                      }
                    }}
                    disabled={groupContacts.length === 0}
                    className={`px-2 py-1 text-xs rounded ${
                      groupContacts.length > 0
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    수신자 전체 추가
                  </button>
                  <button
                    onClick={() => setIsAddContactModalOpen(true)}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    새 연락처 생성
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={groupContacts.length === 0}
                    className={`px-2 py-1 text-xs rounded ${
                      groupContacts.length > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    엑셀 다운
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedContacts.length === 0}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedContacts.length > 0
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    선택 삭제
                  </button>
                  <button
                    onClick={handleClearAllContacts}
                    disabled={groupContacts.length === 0}
                    className={`px-2 py-1 text-xs rounded ${
                      groupContacts.length > 0
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    비우기
                  </button>
                </div>
              </div>

              {/* 검색 영역 */}
              <div className="p-3 border-b bg-white">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="이름 or 전화번호로 검색"
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* 연락처 목록 테이블 */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">로딩 중...</p>
                  </div>
                ) : groupContacts.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">연락처가 없습니다.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left w-8">
                          <input type="checkbox" className="w-4 h-4" />
                        </th>
                        <th className="p-2 text-left">이름</th>
                        <th className="p-2 text-left">전화번호</th>
                        {selectedGroup?.custom_fields?.map((field, index) => (
                          <th key={index} className="p-2 text-left">{field.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => {
                        const isSelected = selectedContacts.some(c => c.id === contact.id);
                        const customData = typeof contact.custom_data === 'object' ? contact.custom_data : {};
                        return (
                          <tr
                            key={contact.id}
                            onClick={() => handleContactToggle(contact)}
                            className={`border-b cursor-pointer hover:bg-gray-50 ${
                              isSelected ? 'bg-purple-50' : ''
                            }`}
                          >
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="p-2">{contact.name || '이름 없음'}</td>
                            <td className="p-2 text-gray-600">{contact.phone_number}</td>
                            {selectedGroup?.custom_fields?.map((field, index) => (
                              <td key={index} className="p-2 text-gray-600">
                                {customData[field.label] || '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* 우측: 추가한 수신번호 (현재 MessageSendTab에 있는 번호들) */}
          <div className={`${selectedGroupId ? 'w-1/3' : 'flex-1'} flex flex-col`}>
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <span className="text-sm font-medium">
                추가한 수신번호 (총 {currentRecipients.length}개)
              </span>
              {currentRecipients.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('모든 수신번호를 비우시겠습니까?')) {
                      if (onClearRecipients) {
                        onClearRecipients();
                      }
                    }
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  비우기
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {currentRecipients.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">수신자명단이 비어있습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentRecipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 border border-gray-200 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{recipient.name || '이름 없음'}</div>
                          <div className="text-sm text-gray-500">{recipient.phone_number}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-300 bg-gray-50">
          <div className="text-sm text-gray-600">
            선택된 연락처: {selectedContacts.length}개
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={selectedContacts.length === 0}
              className={`px-4 py-2 rounded ${
                selectedContacts.length > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              수신자 명단에 추가
            </button>
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 새 그룹 생성 모달 */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onConfirm={handleCreateGroup}
      />

      {/* 주소록 엑셀 업로드 모달 */}
      <AddressBookExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onConfirm={handleExcelUpload}
      />

      {/* 새 연락처 추가 모달 */}
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onConfirm={handleAddContact}
        customFields={selectedGroup?.custom_fields}
      />
    </div>
  );
};

export default AddressBookModal;