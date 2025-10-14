"use client";

import React, { useState } from "react";
import { X, HelpCircle, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface Contact {
  name?: string;
  phone_number: string;
}

interface TextUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
}

const TextUploadModal: React.FC<TextUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Contact[]>([]);
  const [groupName, setGroupName] = useState("");

  if (!isOpen) return null;

  const parseTextToContacts = (inputText: string): Contact[] => {
    const lines = inputText.split('\n').filter(line => line.trim());
    const contacts: Contact[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 전화번호 추출 (01로 시작하는 10~11자리 숫자 또는 +82로 시작)
      let phoneMatch = trimmedLine.match(/01[0-9]{8,9}/);
      let phoneNumber = phoneMatch ? phoneMatch[0] : null;

      // +82 형식 처리
      if (!phoneNumber) {
        const plusMatch = trimmedLine.match(/\+82[0-9]{9,10}/);
        if (plusMatch) {
          phoneNumber = '0' + plusMatch[0].substring(3);
        }
      }

      if (phoneNumber) {
        // 이름 추출 (전화번호를 제외한 나머지 텍스트)
        const nameText = trimmedLine.replace(/[\+]?[0-9-\s]+/g, '').trim();

        contacts.push({
          phone_number: phoneNumber,
          name: nameText || undefined
        });
      }
    }

    return contacts;
  };

  const handleOpenPreview = () => {
    if (!text.trim()) return;

    const contacts = parseTextToContacts(text);
    if (contacts.length === 0) {
      alert("유효한 전화번호가 없습니다");
      return;
    }

    setParsedContacts(contacts);
    setIsPreviewModalOpen(true);
  };

  const getValidToken = async (): Promise<string | null> => {
    let token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;

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
    if (!text.trim()) return;

    const contacts = parseTextToContacts(text);
    if (contacts.length === 0) {
      alert("유효한 전화번호가 없습니다");
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

        for (const contact of contacts) {
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

    // 수신자 목록에 추가
    onConfirm(text);
    setText("");
    setSaveToAddressBook(false);
    setGroupName("");
    setParsedContacts([]);
    onClose();
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
          <div className="mb-4">
            <label className="block font-medium mb-2">연락처 입력</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`입력 예시)\n01022221111 홍길동\n010-1234-1111 박김동\n+821012341234 고길동`}
              className="w-full h-64 p-3 border border-gray-300 rounded text-sm resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              여러 연락처를 추가하는 경우 엔터(Enter)키를 통해 줄바꿈 합니다.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToAddressBook}
                  onChange={(e) => setSaveToAddressBook(e.target.checked)}
                  className="sr-only peer"
                />
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
                disabled={!text.trim()}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                수신자 목록에 추가
              </button>
              <button
                onClick={handleOpenPreview}
                disabled={!text.trim()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                미리보기
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={() => router.push("/support?tab=contact")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            문의
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            닫기
          </button>
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

export default TextUploadModal;