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
import "./styles.css";

export default function MessageSendPage() {
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
    <div className="message-send-container">
      <div className="message-content">
        {/* 단일 카드 레이아웃 */}
        <div className="single-content">
          <div className="content-section">
            <div className="section-header">
              <Smartphone className="icon" size={16} />
              <span>메시지 발신번호</span>
            </div>
            {selectedSender ? (
              <div className="selected-sender">
                <div className="sender-info-row">
                  <div className="sender-details">
                    <div className="sender-display">
                      <Phone className="sender-icon" size={16} />
                      <span className="sender-title">메시지 발신번호</span>
                    </div>
                    <div className="sender-number">{selectedSender}</div>
                  </div>
                  <button
                    className="change-button"
                    onClick={() => setShowSenderModal(true)}
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    <ArrowLeftRight size={14} />
                    변경
                  </button>
                </div>
              </div>
            ) : (
              <div className="sender-selection">
                <div className="sender-info">
                  <span className="sender-label">선택된 발신번호 없음</span>
                  <button
                    className="select-button"
                    onClick={() => setShowSenderModal(true)}
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    선택
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="content-section">
            <div className="section-header">
              <Phone className="icon" size={16} />
              <span>메시지 수신번호</span>
            </div>
            <div className="recipient-input">
              <input
                type="text"
                value={recipientNumbers}
                onChange={(e) => setRecipientNumbers(e.target.value)}
                placeholder="01022224444 수신"
                className="number-input"
              />
              <div className="input-help">
                <HelpCircle className="help-icon" size={14} />
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="section-header">
              <span>내용 입력</span>
            </div>
            <div className="message-input-section">
              <div className="form-group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="이곳에 문자 내용을 입력합니다
치환문구 예시) #{이름}님 #{시간}까지 방문 예약입니다."
                  className="message-textarea"
                  maxLength={2000}
                />
                <div className="message-footer">
                  <span className="char-count">
                    {message.length} / 2,000 bytes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="section-header">
              <ImageIcon className="icon" size={16} />
              <span>이미지 첨부</span>
              <span className="file-info">
                (최대 300KB, JPG/JPEG, 1500×1440 이하)
              </span>
            </div>
            <div className="file-attachment-section">
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
                className="file-select-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip size={16} />
                이미지 선택
              </button>

              {attachedFiles.length > 0 && (
                <div className="attached-files">
                  {attachedFiles.map((fileData, index) => (
                    <div key={index} className="file-item">
                      <div className="file-preview">
                        <Image
                          src={fileData.preview}
                          alt={fileData.file.name}
                          className="preview-image"
                          width={100}
                          height={100}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div className="file-info-detail">
                        <div className="file-name">{fileData.file.name}</div>
                        <div className="file-size">
                          {Math.round(fileData.file.size / 1024)}KB
                        </div>
                        {fileData.uploading && (
                          <div className="upload-status uploading">
                            업로드 중...
                          </div>
                        )}
                        {fileData.fileId && (
                          <div className="upload-status uploaded">
                            업로드 완료
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="remove-file-button"
                        onClick={() => removeFile(index)}
                        disabled={fileData.uploading || isLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="content-section">
            <button
              className="send-button"
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
          className="modal-overlay"
          onClick={() => setShowSenderModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>발신번호 선택</h2>
              <button
                className="modal-close"
                onClick={() => setShowSenderModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-search">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="번호, 별칭으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <Search className="search-icon" size={20} />
              </div>
            </div>

            <div className="modal-body">
              {filteredNumbers.map((sender, index) => (
                <div
                  key={index}
                  className="sender-item"
                  onClick={() => handleSenderSelect(sender.number)}
                >
                  <div className="sender-info-modal">
                    <div className="sender-number-large">{sender.number}</div>
                    <div className="sender-status">({sender.status})</div>
                  </div>
                  {selectedSender === sender.number ? (
                    <button className="deselect-btn">선택해제</button>
                  ) : (
                    <button className="select-btn">선택</button>
                  )}
                  <div
                    className="more-menu-container"
                    ref={showMoreMenu === sender.number ? moreMenuRef : null}
                  >
                    <button
                      className="more-btn"
                      onClick={(e) => handleMoreClick(sender.number, e)}
                    >
                      <span>⋮</span>
                    </button>
                    {showMoreMenu === sender.number && (
                      <div className="more-menu">
                        <button
                          className="menu-item"
                          onClick={() => handleDefaultSet(sender.number)}
                        >
                          기본으로 설정
                        </button>
                        <button
                          className="menu-item"
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

            <div className="modal-footer">
              <button className="manage-btn">
                <Settings size={16} />
                발신번호 관리
              </button>
              <button
                className="close-btn"
                onClick={() => setShowSenderModal(false)}
              >
                닫기 <span className="esc-text">ESC</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 별칭 변경 모달 */}
      {showAliasModal && (
        <div className="modal-overlay" onClick={() => setShowAliasModal(false)}>
          <div
            className="alias-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alias-modal-header">
              <h3>[{editingNumber}] 발신번호 별칭</h3>
              <button
                className="modal-close"
                onClick={() => setShowAliasModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="alias-modal-body">
              <div className="alias-form-group">
                <label className="alias-label">발신번호 별칭</label>
                <input
                  type="text"
                  value={aliasValue}
                  onChange={(e) => setAliasValue(e.target.value)}
                  className="alias-input"
                  placeholder="별칭을 입력하세요"
                />
              </div>

              <button className="alias-save-btn" onClick={handleAliasSave}>
                별칭 입력 완료
              </button>
            </div>

            <div className="alias-modal-footer">
              <div className="alias-footer-left">
                <RefreshCw size={16} />
                <span>채팅 문의</span>
                <span className="red-dot">●</span>
              </div>
              <button
                className="alias-close-btn"
                onClick={() => setShowAliasModal(false)}
              >
                닫기 <span className="esc-text">ESC</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 해상도 초과 확인 다이얼로그 */}
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
  );
}
