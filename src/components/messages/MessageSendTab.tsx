"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Smartphone,
  Phone,
  HelpCircle,
  X,
  Search,
  Settings,
  ArrowLeftRight,
  RefreshCw,
  Paperclip,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  getImageDimensionsFromFile,
  resizeImage,
  isResolutionExceeded,
  isFileSizeExceeded,
  ImageDimensions,
} from "@/lib/imageUtils";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";

const MessageSendTab = () => {
  const [recipientNumbers, setRecipientNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [selectedSender, setSelectedSender] = useState("테스트 번호");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState("");
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [editingNumber, setEditingNumber] = useState("");
  const [aliasValue, setAliasValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      file: File;
      fileId?: string;
      preview: string;
      uploading: boolean;
    }>
  >([]);

  // 해상도 확인 다이얼로그 상태
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    dimensions: ImageDimensions;
  } | null>(null);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 발신번호 목록 (예시 데이터)
  const [senderNumbers, setSenderNumbers] = useState([
    { number: "010-1234-5678", status: "별칭 없음", verified: true },
    { number: "010-9876-5432", status: "별칭 없음", verified: true },
  ]);

  const filteredNumbers = senderNumbers.filter(
    (sender) => sender.number.includes(searchTerm) || searchTerm === ""
  );

  // 외부 클릭 시 더보기 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSend = async () => {
    if (!selectedSender) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    if (!recipientNumbers) {
      alert("수신번호를 입력해주세요.");
      return;
    }

    if (!message) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    // 파일이 업로드 중인지 확인
    const hasUploadingFiles = attachedFiles.some((file) => file.uploading);
    if (hasUploadingFiles) {
      alert("파일 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 업로드 실패한 파일이 있는지 확인
    const hasFailedFiles = attachedFiles.some(
      (file) => !file.uploading && !file.fileId
    );
    if (hasFailedFiles) {
      alert("업로드에 실패한 파일이 있습니다. 파일을 다시 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // 업로드된 파일 ID 수집
      const fileIds = attachedFiles
        .filter((file) => file.fileId)
        .map((file) => file.fileId);

      const response = await fetch("/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumbers: [recipientNumbers.replace(/-/g, "")], // 하이픈 제거
          message: message,
          fileIds: fileIds.length > 0 ? fileIds : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        // 전송 성공 시 모든 입력 초기화
        setRecipientNumbers("");
        setMessage("");
        setAttachedFiles([]);
      } else {
        const errorMessage = result.error || "알 수 없는 오류가 발생했습니다.";
        const details = result.details
          ? `\n\n상세 정보: ${result.details}`
          : "";

        alert(`메시지 전송에 실패했습니다.\n\n${errorMessage}${details}`);
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      alert("메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSenderSelect = (number: string) => {
    if (selectedSender === number) {
      setSelectedSender("");
    } else {
      setSelectedSender(number);
    }
    setShowSenderModal(false);
    setSearchTerm("");
  };

  const handleMoreClick = (number: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowMoreMenu(showMoreMenu === number ? "" : number);
  };

  const handleAliasEdit = (number: string) => {
    setEditingNumber(number);
    const sender = senderNumbers.find((s) => s.number === number);
    setAliasValue(sender?.status === "별칭 없음" ? "" : sender?.status || "");
    setShowAliasModal(true);
    setShowMoreMenu("");
  };

  const handleAliasSave = () => {
    setSenderNumbers((prev) =>
      prev.map((sender) =>
        sender.number === editingNumber
          ? { ...sender, status: aliasValue || "별칭 없음" }
          : sender
      )
    );
    setShowAliasModal(false);
    setEditingNumber("");
    setAliasValue("");
  };

  const handleDefaultSet = (number: string) => {
    setShowMoreMenu("");
    alert(`${number}을(를) 기본으로 설정했습니다.`);
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // 파일 형식 검증 (네이버 SENS API는 JPG/JPEG만 지원)
      const allowedTypes = ["image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}: JPG/JPEG 형식의 이미지 파일만 업로드 가능합니다.`);
        continue;
      }

      try {
        // 이미지 해상도 확인
        const dimensions = await getImageDimensionsFromFile(file);

        // 해상도 초과 확인
        if (isResolutionExceeded(dimensions)) {
          // 해상도 초과 시 사용자에게 확인
          setPendingFile({ file, dimensions });
          setShowResolutionDialog(true);
          break; // 한 번에 하나씩 처리
        } else {
          // 해상도가 적절한 경우 바로 처리
          await processFile(file);
        }
      } catch (error) {
        console.error("이미지 해상도 확인 실패:", error);
        alert(`${file.name}: 이미지 정보를 읽을 수 없습니다.`);
      }
    }

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 파일 처리 함수
  const processFile = async (file: File) => {
    // 파일 크기 검증 (300KB)
    if (isFileSizeExceeded(file)) {
      alert(
        `${file.name}: 파일 크기는 300KB 이하여야 합니다. (현재: ${Math.round(
          file.size / 1024
        )}KB)`
      );
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = e.target?.result as string;
      const newFileData = {
        file,
        preview,
        uploading: true,
      };

      setAttachedFiles((prev) => [...prev, newFileData]);

      // 바로 업로드 시작
      const currentIndex = attachedFiles.length;
      await uploadFileImmediately(file, currentIndex);
    };
    reader.readAsDataURL(file);
  };

  // 해상도 낮춤 확인 핸들러
  const handleResolutionConfirm = async () => {
    if (!pendingFile) return;

    try {
      // 이미지 해상도 낮춤
      const resizedFile = await resizeImage(pendingFile.file);

      // 리사이징된 파일 처리
      await processFile(resizedFile);

      // 상태 초기화
      setPendingFile(null);
      setShowResolutionDialog(false);
    } catch (error) {
      console.error("이미지 리사이징 실패:", error);
      alert("이미지 해상도를 낮추는 중 오류가 발생했습니다.");
      setPendingFile(null);
      setShowResolutionDialog(false);
    }
  };

  // 해상도 낮춤 취소 핸들러
  const handleResolutionCancel = () => {
    setPendingFile(null);
    setShowResolutionDialog(false);
  };

  // 파일 선택 시 즉시 업로드
  const uploadFileImmediately = async (file: File, fileIndex: number) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/message/upload-file", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setAttachedFiles((prev) =>
          prev.map((item, index) =>
            index === fileIndex
              ? { ...item, uploading: false, fileId: result.fileId }
              : item
          )
        );
      } else {
        alert(`파일 업로드 실패: ${result.error}`);
        setAttachedFiles((prev) =>
          prev.map((item, index) =>
            index === fileIndex ? { ...item, uploading: false } : item
          )
        );
      }
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
      setAttachedFiles((prev) =>
        prev.map((item, index) =>
          index === fileIndex ? { ...item, uploading: false } : item
        )
      );
    }
  };

  // 파일 삭제
  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <AdvertiserGuardWithDisabled>
      <div className="w-full max-w-none m-0 p-5 bg-white min-h-[calc(100vh-140px)] box-border relative">
        <div className="flex justify-center w-full items-start box-border">
          {/* 단일 카드 레이아웃 */}
          <div className="w-full max-w-[600px] bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1)] p-5 h-fit">
            {/* 발신번호 섹션 */}
            <div className="mb-5 border-b border-gray-200 pb-4 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-2 mb-3 font-semibold text-gray-700 text-sm">
                <Smartphone className="w-4 h-4 text-gray-600" />
                <span>메시지 발신번호</span>
              </div>
              {selectedSender ? (
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">메시지 발신번호</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-700 m-0">{selectedSender}</div>
                    </div>
                    <button
                      className="bg-purple-600 text-white border-none py-2 px-4 rounded text-sm flex items-center gap-1.5 transition-colors hover:bg-purple-700 flex-shrink-0 opacity-50 cursor-not-allowed"
                      onClick={() => setShowSenderModal(true)}
                      disabled
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      변경
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">선택된 발신번호 없음</span>
                    <button
                      className="bg-purple-600 text-white border-none py-1.5 px-3 rounded text-xs opacity-50 cursor-not-allowed"
                      onClick={() => setShowSenderModal(true)}
                      disabled
                    >
                      선택
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 수신번호 섹션 */}
            <div className="mb-5 border-b border-gray-200 pb-4 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-2 mb-3 font-semibold text-gray-700 text-sm">
                <Phone className="w-4 h-4 text-gray-600" />
                <span>메시지 수신번호</span>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={recipientNumbers}
                  onChange={(e) => setRecipientNumbers(e.target.value)}
                  placeholder="01012345678"
                  className="w-full py-2.5 px-3 border border-gray-300 rounded text-sm mb-2 box-border"
                />
                <div className="flex justify-end mb-2">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-600 cursor-help" />
                </div>
              </div>
            </div>

            {/* 메시지 내용 섹션 */}
            <div className="mb-5 border-b border-gray-200 pb-4 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-2 mb-3 font-semibold text-gray-700 text-sm">
                <span>내용 입력</span>
              </div>
              <div className="bg-white rounded-md p-0">
                <div className="mb-4 last:mb-0">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="문자 내용을 입력해주세요."
                    className="w-full min-h-[200px] p-4 border border-gray-300 rounded-md text-sm resize-y font-inherit leading-6 box-border transition-colors focus:outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(108,92,231,0.1)]"
                    maxLength={2000}
                  />
                  <div className="flex justify-end items-center mt-2">
                    <span className="text-xs text-gray-600 text-right block">
                      {message.length} / 2,000 bytes
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 이미지 첨부 섹션 */}
            <div className="mb-5 border-b border-gray-200 pb-4 last:border-b-0 last:mb-0 last:pb-0">
              <div className="flex items-center gap-2 mb-3 font-semibold text-gray-700 text-sm">
                <ImageIcon className="w-4 h-4 text-gray-600" />
                <span>이미지 첨부</span>
                <span className="text-xs text-gray-600 ml-2">(최대 300KB, JPG/JPEG)</span>
              </div>
              <div className="mt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/jpg"
                  multiple
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  className="flex items-center gap-2 bg-gray-200 border-2 border-dashed border-gray-300 text-gray-500 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all w-full justify-center hover:bg-gray-200 hover:border-gray-400 hover:text-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="w-4 h-4" />
                  이미지 선택
                </button>

                {attachedFiles.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3">
                    {attachedFiles.map((fileData, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-200 border border-gray-300 rounded-lg transition-colors hover:bg-gray-200">
                        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-white border border-gray-300">
                          <Image
                            src={fileData.preview}
                            alt={fileData.file.name}
                            className="w-full h-full object-cover"
                            width={48}
                            height={48}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                            {fileData.file.name}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {Math.round(fileData.file.size / 1024)}KB
                          </div>
                          {fileData.uploading && (
                            <div className="text-xs font-medium text-blue-600">
                              업로드 중...
                            </div>
                          )}
                          {fileData.fileId && (
                            <div className="text-xs font-medium text-green-600">
                              업로드 완료
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="flex-shrink-0 bg-none border-none text-red-600 cursor-pointer p-2 rounded transition-colors hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => removeFile(index)}
                          disabled={fileData.uploading || isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 전송 버튼 섹션 */}
            <div className="mb-5 border-b border-gray-200 pb-4 last:border-b-0 last:mb-0 last:pb-0">
              <button
                className="bg-purple-600 text-white border-none py-4 px-12 rounded-md text-base font-semibold cursor-pointer transition-colors min-h-14 w-full hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleSend}
                disabled={isLoading || !message}
              >
                {isLoading ? "전송 중..." : "전송"}
              </button>
            </div>
          </div>
        </div>

        {/* 발신번호 선택 모달 */}
        {showSenderModal && (
          <div
            className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]"
            onClick={() => setShowSenderModal(false)}
          >
            <div className="bg-white rounded-xl w-[90%] max-w-[600px] max-h-[80vh] overflow-hidden shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-700 m-0">발신번호 선택</h2>
                <button
                  className="bg-none border-none cursor-pointer text-gray-600 p-1 rounded transition-colors hover:bg-gray-200"
                  onClick={() => setShowSenderModal(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-5 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="번호, 별칭으로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-3 px-4 pl-12 border border-gray-300 rounded-lg text-sm box-border transition-colors focus:outline-none focus:border-purple-600 focus:shadow-[0_0_0_3px_rgba(108,92,231,0.1)]"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-0">
                {filteredNumbers.map((sender, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-200 last:border-b-0"
                    onClick={() => handleSenderSelect(sender.number)}
                  >
                    <div className="flex-1">
                      <div className="text-base font-semibold text-gray-700 mb-1">{sender.number}</div>
                      <div className="text-sm text-gray-600">({sender.status})</div>
                    </div>
                    {selectedSender === sender.number ? (
                      <button className="bg-white text-purple-600 border-2 border-purple-600 py-2 px-4 rounded-md text-sm font-medium cursor-pointer mr-2 transition-all hover:bg-purple-600 hover:text-white">선택해제</button>
                    ) : (
                      <button className="bg-purple-600 text-white border-none py-2 px-4 rounded-md text-sm font-medium cursor-pointer mr-2 transition-colors hover:bg-purple-700">선택</button>
                    )}
                    <div
                      className="relative"
                      ref={showMoreMenu === sender.number ? moreMenuRef : null}
                    >
                      <button
                        className="bg-none border-none cursor-pointer p-2 rounded text-gray-600 text-lg leading-none transition-colors hover:bg-gray-100"
                        onClick={(e) => handleMoreClick(sender.number, e)}
                      >
                        <span>⋮</span>
                      </button>
                      {showMoreMenu === sender.number && (
                        <div className="absolute top-full right-0 bg-white border border-gray-200 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1001] min-w-[120px] overflow-hidden">
                          <button
                            className="block w-full p-3 border-none bg-white text-left text-sm text-gray-700 cursor-pointer transition-colors hover:bg-gray-200 border-b border-gray-100"
                            onClick={() => handleDefaultSet(sender.number)}
                          >
                            기본으로 설정
                          </button>
                          <button
                            className="block w-full p-3 border-none bg-white text-left text-sm text-gray-700 cursor-pointer transition-colors hover:bg-gray-200"
                            onClick={() => handleAliasEdit(sender.number)}
                          >
                            별칭 변경
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-5 border-t border-gray-200 bg-gray-200">
                <button className="bg-gray-100 text-gray-700 border-none py-2.5 px-4 rounded-md text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-gray-200">
                  <Settings className="w-4 h-4" />
                  발신번호 관리
                </button>
                <button
                  className="bg-none border-none cursor-pointer text-sm text-gray-600 flex items-center gap-2 p-2 rounded transition-colors hover:bg-gray-200"
                  onClick={() => setShowSenderModal(false)}
                >
                  닫기 <span className="bg-gray-200 text-gray-600 py-0.5 px-1.5 rounded text-xs font-medium">ESC</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 별칭 변경 모달 */}
        {showAliasModal && (
          <div
            className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]"
            onClick={() => setShowAliasModal(false)}
          >
            <div
              className="bg-white rounded-xl w-[90%] max-w-[500px] overflow-hidden shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 m-0">[{editingNumber}] 발신번호 별칭</h3>
                <button
                  className="bg-none border-none cursor-pointer text-gray-600 p-1 rounded transition-colors hover:bg-gray-200"
                  onClick={() => setShowAliasModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-purple-600">발신번호 별칭</label>
                  <input
                    type="text"
                    value={aliasValue}
                    onChange={(e) => setAliasValue(e.target.value)}
                    className="w-full py-3 px-4 border-2 border-purple-600 rounded-lg text-sm box-border transition-colors focus:outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_rgba(108,92,231,0.1)]"
                    placeholder="별칭을 입력하세요"
                  />
                </div>

                <button className="w-full bg-purple-600 text-white border-none py-3.5 px-5 rounded-lg text-base font-semibold cursor-pointer transition-colors hover:bg-purple-700" onClick={handleAliasSave}>
                  별칭 입력 완료
                </button>
              </div>

              <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="w-4 h-4" />
                  <span>채팅 문의</span>
                  <span className="text-red-500 text-xs">●</span>
                </div>
                <button
                  className="bg-none border-none cursor-pointer text-sm text-gray-600 flex items-center gap-2 p-2 rounded transition-colors hover:bg-gray-200"
                  onClick={() => setShowAliasModal(false)}
                >
                  닫기 <span className="bg-gray-200 text-gray-600 py-0.5 px-1.5 rounded text-xs font-medium">ESC</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 해상도 확인 다이얼로그 */}
        <ConfirmDialog
          isOpen={showResolutionDialog}
          onClose={handleResolutionCancel}
          onConfirm={handleResolutionConfirm}
          title="이미지 해상도 초과"
          message={
            pendingFile
              ? `선택한 이미지의 해상도가 제한을 초과합니다.\n\n현재 해상도: ${pendingFile.dimensions.width}×${pendingFile.dimensions.height}\n최대 허용: 1500×1440\n\n이미지 해상도를 자동으로 낮춰서 업로드하시겠습니까?`
              : ""
          }
          confirmText="예, 해상도를 낮춰서 업로드"
          cancelText="아니오, 취소"
          type="warning"
        />
      </div>
    </AdvertiserGuardWithDisabled>
  );
};

export default MessageSendTab;