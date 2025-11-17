"use client";

import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import {
  Info,
  RefreshCw,
  Send,
  Image as ImageIcon,
  FileText,
  Upload,
  Save,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  fetchSenderProfiles,
  sendFriendtalk,
  type SenderProfile,
} from "@/utils/kakaoApi";
import {
  replaceVariables as replaceStandardVariables,
  countReplaceableVariables,
} from "@/utils/messageVariables";
import SimpleContentSaveModal from "@/components/modals/SimpleContentSaveModal";
import LoadContentModal from "@/components/modals/LoadContentModal";
import FriendtalkButtonModal from "@/components/modals/FriendtalkButtonModal";
import VariableSelectModal from "../modals/VariableSelectModal";

interface Recipient {
  phone_number: string;
  name?: string;
  group_name?: string; // 추가
  variables?: Record<string, string>;
}

export interface FriendtalkData {
  selectedProfile: string;
  messageType: "FT" | "FI" | "FW" | "FL" | "FC";
  message: string;
  adFlag: "Y" | "N";
  uploadedImages: Array<{
    fileId: string;
    fileName: string;
    fileSize: number;
    preview: string;
  }>;
  buttons: Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>;
  imageLink: string; // FW 타입 전용
  headerText: string; // FL 타입 전용
  listItems: Array<{
    title: string;
    url_mobile?: string;
    url_pc?: string;
    image?: {
      fileId: string;
      fileName: string;
      fileSize: number;
      preview: string;
    };
  }>; // FL 타입 전용
  carousels: Array<{
    header: string;
    content: string;
    image?: {
      fileId: string;
      fileName: string;
      fileSize: number;
      preview: string;
    };
    buttons: Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>;
  }>; // FC 타입 전용
  moreLink: string; // FC 타입 전용
  enableSmsBackup: boolean;
  smsBackupMessage: string;
  userInfo: {
    phone: string;
    name: string;
    company: string;
  };
}

/**
 * 친구톡 발송 함수 (MessageSendTab에서 호출)
 * @param params - 발송 파라미터
 * @param params.recipients - 수신자 목록
 * @param params.callbackNumber - 발신번호
 * @param params.data - FriendtalkTab의 현재 데이터
 * @param params.scheduledAt - 예약 발송 시간 (YYYYMMDDHHmmss 형식, 즉시 발송 시 undefined)
 * @returns 발송 결과 { successCount, failCount }
 */
export async function sendFriendtalkMessage(params: {
  recipients: Recipient[];
  callbackNumber: string;
  data: FriendtalkData;
  scheduledAt?: string;
}) {
  const { recipients, callbackNumber, data, scheduledAt } = params;
  const {
    selectedProfile,
    messageType,
    message,
    adFlag,
    uploadedImages,
    buttons,
    imageLink,
    headerText,
    listItems,
    carousels,
    moreLink,
    enableSmsBackup,
    smsBackupMessage,
    userInfo,
  } = data;

  // 유효성 검사
  if (!selectedProfile) {
    throw new Error("발신 프로필을 선택해주세요.");
  }

  if (messageType !== "FL" && messageType !== "FC" && !message.trim()) {
    throw new Error("메시지 내용을 입력해주세요.");
  }

  if (recipients.length === 0) {
    throw new Error("수신자를 입력해주세요.");
  }

  if (!callbackNumber) {
    throw new Error("발신번호를 입력해주세요.");
  }

  // 타입별 이미지 필수 검증
  if (messageType === "FI" && uploadedImages.length === 0) {
    throw new Error("FI (이미지형) 타입은 이미지가 필수입니다.");
  }

  if (messageType === "FW" && uploadedImages.length === 0) {
    throw new Error("FW (와이드형) 타입은 이미지가 필수입니다.");
  }

  if (messageType === "FL") {
    if (!headerText || headerText.trim().length === 0) {
      throw new Error("FL (와이드 아이템 리스트형) 타입은 헤더가 필수입니다.");
    }
    if (listItems.length < 3 || listItems.length > 4) {
      throw new Error("FL (와이드 아이템 리스트형) 타입은 3-4개의 아이템이 필요합니다.");
    }
    const itemsWithoutImage = listItems.filter((item) => !item.image);
    if (itemsWithoutImage.length > 0) {
      throw new Error("FL (와이드 아이템 리스트형) 타입은 모든 아이템에 이미지가 필수입니다.");
    }
  }

  if (messageType === "FC") {
    if (carousels.length < 2 || carousels.length > 6) {
      throw new Error("FC (캐러셀형) 타입은 2-6개의 캐러셀이 필요합니다.");
    }
  }

  // 각 수신자별로 변수 치환된 메시지 생성
  let successCount = 0;
  let failCount = 0;

  for (const recipient of recipients) {
    try {
      // Step 1: 표준 변수 치환
      let replacedMessage = replaceStandardVariables(
        message,
        {
          name: recipient.name,
          phone: recipient.phone_number,
          groupName: recipient.group_name || recipient.variables?.["그룹명"],
        },
        userInfo
      );

      // Step 2: 커스텀 변수 치환
      if (recipient.variables) {
        for (const [key, value] of Object.entries(recipient.variables)) {
          if (
            !["이름", "전화번호", "그룹명", "오늘날짜", "현재시간", "요일", "발신번호", "회사명", "담당자명"].includes(key)
          ) {
            const pattern = new RegExp(`#{${key}}`, "g");
            replacedMessage = replacedMessage.replace(pattern, value);
          }
        }
      }

      // Step 3: 친구톡 발송
      const result = await sendFriendtalk({
        senderKey: selectedProfile,
        recipients: [{ phone_number: recipient.phone_number, name: recipient.name }],
        message: replacedMessage,
        messageType: messageType,
        adFlag: adFlag,
        imageUrls: uploadedImages.length > 0 ? [uploadedImages[0].fileId] : undefined,
        imageLink: messageType === "FW" ? imageLink : undefined,
        buttons: buttons,
        headerText: messageType === "FL" ? headerText : undefined,
        listItems: messageType === "FL" ? listItems : undefined,
        carousels: messageType === "FC" ? carousels : undefined,
        moreLink: messageType === "FC" ? moreLink : undefined,
        callbackNumber: callbackNumber,
        tranType: enableSmsBackup ? "SMS" : undefined,
        tranMessage: enableSmsBackup ? smsBackupMessage : undefined,
        sendDate: scheduledAt, // 예약 발송 시간 추가
      });

      if (result.successCount > 0) successCount++;
      else failCount++;
    } catch (error) {
      console.error("친구톡 발송 실패:", error);
      failCount++;
    }
  }

  return { successCount, failCount };
}

interface FriendtalkTabProps {
  recipients?: Recipient[]; // 상위 컴포넌트에서 전달받는 수신자 목록 (전화번호 + 이름)
  callbackNumber?: string; // 발신번호
  onSendComplete?: (result: unknown) => void; // 발송 완료 콜백
  onDataChange?: (data: FriendtalkData) => void; // 데이터 변경 시 상위로 전달
}

interface UploadedImage {
  fileId: string;
  fileName: string;
  fileSize: number;
  preview: string;
}

type MessageType = "FT" | "FI" | "FW" | "FL" | "FC";

const FriendtalkTab: React.FC<FriendtalkTabProps> = ({
  recipients = [],
  callbackNumber = "",
  onSendComplete,
  onDataChange,
}) => {
  // 상태 관리
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adFlag, setAdFlag] = useState<"Y" | "N">("N");
  const [messageType, setMessageType] = useState<MessageType>("FT");
  const [message, setMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [enableSmsBackup, setEnableSmsBackup] = useState(false);
  const [smsBackupMessage, setSmsBackupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // UI 관련 state
  const [imageLink, setImageLink] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listItemFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const carouselFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 버튼 및 모달 관련 state
  const [buttons, setButtons] = useState<
    Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>
  >([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadModalActiveTab, setLoadModalActiveTab] = useState<
    "saved" | "recent"
  >("saved");
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);

  // FW/FL/FC 전용 state
  const [headerText, setHeaderText] = useState(""); // FL용 헤더
  const [listItems, setListItems] = useState<
    Array<{
      title: string;
      image?: UploadedImage;
      url_mobile?: string;
      url_pc?: string;
    }>
  >([
    { title: "", url_mobile: "", url_pc: "" },
    { title: "", url_mobile: "", url_pc: "" },
    { title: "", url_mobile: "", url_pc: "" },
  ]); // FL용 아이템 리스트
  const [carousels, setCarousels] = useState<
    Array<{
      header?: string;
      content: string;
      image?: UploadedImage;
      buttons: Array<{
        name: string;
        type: string;
        url_mobile?: string;
        url_pc?: string;
      }>;
    }>
  >([
    { header: "", content: "", buttons: [] },
    { header: "", content: "", buttons: [] },
  ]); // FC용 캐러셀
  const [moreLink, setMoreLink] = useState(""); // FC용 더보기 링크

  // 사용자 정보 (변수 치환용)
  const [userInfo, setUserInfo] = useState({
    phone: "",
    name: "",
    companyName: "",
  });

  // 치환 가능한 변수 개수 계산
  const replaceableVariableCount = countReplaceableVariables(message);

  // 컴포넌트 마운트 시 발신 프로필 조회
  useEffect(() => {
    loadSenderProfiles();
  }, []);

  // 사용자 정보 조회 (변수 치환용)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        setUserInfo({
          phone: data.phoneNumber || "",
          name: data.name || "",
          companyName: data.companyInfo?.companyName || "",
        });
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
      }
    };

    fetchUserInfo();
  }, []);

  // FL/FC 타입 선택 시 자동으로 광고 플래그 설정
  // MTS API 규격: FL(와이드아이템리스트), FC(캐러셀) 타입은 광고 발송만 가능
  useEffect(() => {
    if (messageType === "FL" || messageType === "FC") {
      setAdFlag("Y");
    }
  }, [messageType]);

  // 데이터 변경 시 상위 컴포넌트로 전달
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        selectedProfile,
        messageType,
        message,
        adFlag,
        uploadedImages,
        buttons,
        imageLink,
        headerText,
        listItems,
        carousels,
        moreLink,
        enableSmsBackup,
        smsBackupMessage,
        userInfo: {
          phone: userInfo.phone,
          name: userInfo.name,
          company: userInfo.companyName,
        },
      });
    }
  }, [
    selectedProfile,
    messageType,
    message,
    adFlag,
    uploadedImages,
    buttons,
    imageLink,
    headerText,
    listItems,
    carousels,
    moreLink,
    enableSmsBackup,
    smsBackupMessage,
    userInfo,
    onDataChange,
  ]);

  // 메시지 타입 변경 시 모든 필드 초기화
  useEffect(() => {
    // 모든 타입 변경 시 전체 필드 초기화 (각 타입 독립적으로 관리)
    setMessage("");
    setHeaderText("");
    setListItems([]);
    setCarousels([
      { header: "", content: "", buttons: [] },
      { header: "", content: "", buttons: [] }
    ]);
    setMoreLink("");
    setImageLink("");
    setUploadedImages([]);
    setButtons([]);
  }, [messageType]);

  // 발신 프로필 조회
  const loadSenderProfiles = async () => {
    setIsLoadingProfiles(true);
    setErrorMessage("");
    try {
      const profiles = await fetchSenderProfiles();
      setSenderProfiles(profiles);

      // 첫 번째 프로필 자동 선택
      if (profiles.length > 0 && profiles[0].sender_key) {
        setSelectedProfile(profiles[0].sender_key);
      }
    } catch (error) {

      setErrorMessage(
        error instanceof Error ? error.message : "발신 프로필 조회 실패",
      );
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // 변수 선택 핸들러
  const handleVariableSelect = (variable: string) => {
    const textarea = messageInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = message.substring(0, start) + variable + message.substring(end);

    setMessage(newText);

    // 커서 위치 복원
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // 저장내용 모달 열기
  const handleSavedContentClick = () => {
    setLoadModalActiveTab("saved");
    setIsLoadModalOpen(true);
  };

  // 최근발송 모달 열기
  const handleRecentSentClick = () => {
    setLoadModalActiveTab("recent");
    setIsLoadModalOpen(true);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (클라이언트측 5MB, 백엔드에서 자동 최적화)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(
        `이미지 크기는 5MB 이하여야 합니다.\n현재 크기: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      );
      event.target.value = "";
      return;
    }

    // 파일 형식 검증
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert("JPG, JPEG, PNG 형식만 지원됩니다.");
      event.target.value = "";
      return;
    }

    // 최대 1개 제한 (친구톡은 1개만 가능)
    if (uploadedImages.length >= 1) {
      alert("친구톡 이미지는 1개만 첨부할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      // senderKey 확인
      if (!selectedProfile) {
        throw new Error("발신 프로필을 먼저 선택해주세요");
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", selectedProfile); // Kakao 업로드 API는 senderKey 필수
      // FW/FT/FI 타입은 2:1 비율로 자동 크롭 (FW는 와이드형이므로 2:1 권장)
      formData.append("cropRatio", "2:1");

      // Kakao 전용 이미지 업로드 API 호출
      // MTS 서버 이미지는 Kakao에서 접근 불가하므로 Kakao 서버에 업로드
      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이미지 업로드 실패");
      }

      const data = await response.json();

      if (!data.success || !data.imageUrl) {
        throw new Error("이미지 URL을 받지 못했습니다");
      }

      // 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);

      // 업로드된 이미지 추가
      setUploadedImages([
        {
          fileId: data.imageUrl, // Kakao 서버 이미지 URL (https://mud-kage.kakao.com/...)
          fileName: file.name,
          fileSize: data.fileSize,
          preview: previewUrl,
        },
      ]);
    } catch (error) {

      setErrorMessage(
        error instanceof Error ? error.message : "이미지 업로드 실패",
      );
      alert(error instanceof Error ? error.message : "이미지 업로드 실패");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);

    // 미리보기 URL 해제
    if (uploadedImages[index].preview) {
      URL.revokeObjectURL(uploadedImages[index].preview);
    }
  };

  // FL 아이템별 이미지 업로드
  const handleListItemImageUpload = async (
    itemIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 발신 프로필 확인
    if (!selectedProfile) {
      alert("발신 프로필을 먼저 선택해주세요.");
      return;
    }

    // 파일 크기 및 타입 검증 (5MB, JPG/PNG만)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("이미지 크기는 5MB 이하만 업로드 가능합니다.");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert("JPG, PNG 형식의 이미지만 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", selectedProfile);
      // FL 아이템 이미지는 2:1 비율로 자동 크롭 (MTS/Kakao 요구사항)
      formData.append("cropRatio", "2:1");

      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이미지 업로드 실패");
      }

      const data = await response.json();
      const previewUrl = URL.createObjectURL(file);

      // FL 아이템 이미지 업데이트
      const newItems = [...listItems];
      newItems[itemIndex].image = {
        fileId: data.imageUrl,
        fileName: file.name,
        fileSize: data.fileSize,
        preview: previewUrl,
      };
      setListItems(newItems);
    } catch (error) {

      setErrorMessage(
        error instanceof Error ? error.message : "이미지 업로드 실패",
      );
      alert(error instanceof Error ? error.message : "이미지 업로드 실패");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // FL 아이템 이미지 삭제
  const handleListItemImageRemove = (itemIndex: number) => {
    const newItems = [...listItems];
    if (newItems[itemIndex].image?.preview) {
      URL.revokeObjectURL(newItems[itemIndex].image!.preview);
    }
    newItems[itemIndex].image = undefined;
    setListItems(newItems);
  };

  // FC 캐러셀별 이미지 업로드
  const handleCarouselImageUpload = async (
    carouselIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 발신 프로필 확인
    if (!selectedProfile) {
      alert("발신 프로필을 먼저 선택해주세요.");
      return;
    }

    // 파일 크기 및 타입 검증 (5MB, JPG/PNG만)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("이미지 크기는 5MB 이하만 업로드 가능합니다.");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert("JPG, PNG 형식의 이미지만 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", selectedProfile);
      // FC 캐러셀 이미지는 2:1 비율로 자동 크롭 (와이드형)
      formData.append("cropRatio", "2:1");

      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이미지 업로드 실패");
      }

      const data = await response.json();
      const previewUrl = URL.createObjectURL(file);

      // FC 캐러셀 이미지 업데이트
      const newCarousels = [...carousels];
      newCarousels[carouselIndex].image = {
        fileId: data.imageUrl,
        fileName: file.name,
        fileSize: data.fileSize,
        preview: previewUrl,
      };
      setCarousels(newCarousels);
    } catch (error) {

      setErrorMessage(
        error instanceof Error ? error.message : "이미지 업로드 실패",
      );
      alert(error instanceof Error ? error.message : "이미지 업로드 실패");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // FC 캐러셀 이미지 삭제
  const handleCarouselImageRemove = (carouselIndex: number) => {
    const newCarousels = [...carousels];
    if (newCarousels[carouselIndex].image?.preview) {
      URL.revokeObjectURL(newCarousels[carouselIndex].image!.preview);
    }
    newCarousels[carouselIndex].image = undefined;
    setCarousels(newCarousels);
  };

  // 친구톡 발송
  const handleSendFriendtalk = async () => {
    // 유효성 검사
    if (!selectedProfile) {
      alert("발신 프로필을 선택해주세요.");
      return;
    }

    // FT/FI/FW 타입만 message 필드 검증 (FL/FC는 자체 필드 사용)
    if (messageType !== "FL" && messageType !== "FC" && !message.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    if (recipients.length === 0) {
      alert("수신자를 입력해주세요.");
      return;
    }

    if (!callbackNumber) {
      alert("발신번호를 입력해주세요.");
      return;
    }

    // 타입별 이미지 필수 검증
    if (messageType === "FI" && uploadedImages.length === 0) {
      alert(
        "FI (이미지형) 타입은 이미지가 필수입니다.\n이미지를 업로드해주세요.",
      );
      return;
    }

    if (messageType === "FW" && uploadedImages.length === 0) {
      alert(
        "FW (와이드형) 타입은 이미지가 필수입니다.\n이미지를 업로드해주세요.",
      );
      return;
    }

    if (messageType === "FL") {
      if (!headerText || headerText.trim().length === 0) {
        alert("FL (와이드 아이템 리스트형) 타입은 헤더가 필수입니다.");
        return;
      }
      if (listItems.length < 3 || listItems.length > 4) {
        alert(
          "FL (와이드 아이템 리스트형) 타입은 3-4개의 아이템이 필요합니다.",
        );
        return;
      }
      const itemsWithoutImage = listItems.filter((item) => !item.image);
      if (itemsWithoutImage.length > 0) {
        alert(
          "FL (와이드 아이템 리스트형) 타입은 모든 아이템에 이미지가 필수입니다.\n이미지가 없는 아이템이 있습니다.",
        );
        return;
      }
    }

    if (messageType === "FC") {
      if (carousels.length < 2 || carousels.length > 6) {
        alert("FC (캐러셀형) 타입은 2-6개의 캐러셀이 필요합니다.");
        return;
      }
    }

    // 친구톡 메시지 시간 체크 (08시~20시) - 모든 친구톡 메시지에 적용
    const now = new Date();
    const hour = now.getHours();
    if (hour < 8 || hour >= 20) {
      alert(
        "친구톡 메시지는 08시~20시 사이에만 발송 가능합니다.\n(현재 시간: " +
          hour +
          "시)",
      );
      return;
    }

    // 발송 확인
    const confirmed = window.confirm(
      `${recipients.length}명에게 친구톡을 발송하시겠습니까?`,
    );
    if (!confirmed) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      // 업로드된 이미지의 fileId 배열 생성
      const imageFileIds = uploadedImages.map((img) => img.fileId);

      // 선택한 메시지 타입 사용 (자동 감지 아님)
      const selectedMessageType = messageType;

      // 각 수신자별로 변수 치환된 메시지 생성
      const processedRecipients = recipients.map((recipient) => {
        // Step 1: 자동 변수 치환 (messageVariables.ts의 replaceStandardVariables 함수)
        let replacedMessage = replaceStandardVariables(
          message,
          {
            name: recipient.name,
            phone: recipient.phone_number,
            groupName: recipient.group_name || recipient.variables?.["그룹명"],
          },
          userInfo,
        );

        // Step 2: 커스텀 변수 추가 치환 (SMS 발송과 동일한 로직)
        if (recipient.variables) {
          for (const [key, value] of Object.entries(recipient.variables)) {
            // 기본 변수가 아닌 커스텀 변수만 치환
            if (
              ![
                "이름",
                "전화번호",
                "그룹명",
                "오늘날짜",
                "현재시간",
                "요일",
                "발신번호",
                "회사명",
                "담당자명",
              ].includes(key)
            ) {
              const pattern = new RegExp(`#{${key}}`, "g");
              replacedMessage = replacedMessage.replace(pattern, value);
            }
          }
        }

        return {
          phone_number: recipient.phone_number,
          name: recipient.name,
          replacedMessage: replacedMessage,
        };
      });

      // 각 수신자에게 개별 발송 (변수 치환된 메시지로)
      let successCount = 0;
      let failCount = 0;

      for (const recipient of processedRecipients) {
        try {
          const result = await sendFriendtalk({
            senderKey: selectedProfile,
            recipients: [
              { phone_number: recipient.phone_number, name: recipient.name },
            ],
            message: recipient.replacedMessage, // 치환된 메시지 사용
            callbackNumber: callbackNumber,
            messageType: selectedMessageType,
            adFlag: adFlag,
            imageUrls: imageFileIds.length > 0 ? imageFileIds : undefined,
            imageLink: imageLink.trim() || undefined,
            buttons: buttons.length > 0 ? buttons : undefined, // 버튼 추가
            tranType: enableSmsBackup ? "SMS" : undefined,
            tranMessage: enableSmsBackup ? smsBackupMessage : undefined,
            // FW/FL/FC 추가 데이터
            headerText: messageType === "FL" ? headerText : undefined,
            listItems: messageType === "FL" ? listItems : undefined,
            carousels: messageType === "FC" ? carousels : undefined,
            moreLink: messageType === "FC" ? moreLink : undefined,
          });

          if (result.successCount > 0) successCount++;
          else failCount++;
        } catch (error) {
          console.error('친구톡 발송 실패:', error);
          failCount++;
        }
      }

      alert(`친구톡 발송 완료\n성공: ${successCount}건\n실패: ${failCount}건`);

      if (onSendComplete) {
        onSendComplete({ successCount, failCount });
      }

      // 발송 후 메시지 초기화
      setMessage("");
      setUploadedImages([]);
    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : "친구톡 발송 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              카카오 친구톡 V2
            </h3>
            <p className="text-sm text-blue-700">
              친구톡은 템플릿 없이 자유롭게 메시지를 작성할 수 있습니다.
              <br />
              광고성 메시지는 08시~20시 사이에만 발송 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* 발신 프로필 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span>발신 프로필</span>
            <button
              onClick={loadSenderProfiles}
              className="text-blue-600 hover:text-blue-700"
              disabled={isLoadingProfiles}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingProfiles ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </label>

        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingProfiles}
        >
          <option value="">발신 프로필 선택</option>
          {senderProfiles.map((profile) => (
            <option key={profile.sender_key} value={profile.sender_key}>
              {profile.channel_name} ({profile.status})
            </option>
          ))}
        </select>
      </div>

      {/* 메시지 타입 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          메시지 타입
        </label>
        <select
          value={messageType}
          onChange={(e) => setMessageType(e.target.value as MessageType)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="FT">텍스트형 (FT)</option>
          <option value="FI">이미지형 (FI)</option>
          <option value="FW">와이드형 (FW) - 이미지 + 메시지 + 버튼</option>
          <option value="FL">
            와이드 아이템 리스트형 (FL) - 헤더 + 아이템 3-4개
          </option>
          <option value="FC">캐러셀형 (FC) - 캐러셀 2-6개</option>
        </select>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 space-y-1">
              {messageType === "FT" && (
                <>
                  <p>
                    <strong>텍스트형</strong>: 텍스트만으로 구성된 메시지
                  </p>
                  <p>• 최대 1,000자</p>
                </>
              )}
              {messageType === "FI" && (
                <>
                  <p>
                    <strong>이미지형</strong>: 이미지 + 텍스트
                  </p>
                  <p>• 이미지 1개, 최대 500KB</p>
                  <p>• 텍스트 최대 400자</p>
                </>
              )}
              {messageType === "FW" && (
                <>
                  <p>
                    <strong>와이드형</strong>: 와이드 이미지 + 메시지 + 버튼 +
                    쿠폰
                  </p>
                  <p>• 이미지: 800×600px 권장, 2:1 to 1:1 비율</p>
                  <p>• 메시지: 최대 76자, 줄바꿈 1개</p>
                  <p>• 버튼: 최대 2개</p>
                </>
              )}
              {messageType === "FL" && (
                <>
                  <p>
                    <strong>와이드 아이템 리스트형</strong>: 헤더 + 아이템
                    리스트 + 버튼
                  </p>
                  <p>• 헤더: 최대 20자 (줄바꿈 불가)</p>
                  <p>• 아이템: 3~4개, 각각 이미지 + 제목(25자)</p>
                  <p>• 버튼: 최대 2개</p>
                </>
              )}
              {messageType === "FC" && (
                <>
                  <p>
                    <strong>캐러셀형</strong>: 여러 캐러셀 카드 + 더보기
                  </p>
                  <p>• 캐러셀: 2~6개</p>
                  <p>• 각 캐러셀: 최대 180자, 줄바꿈 2개</p>
                  <p>• 버튼: 각 캐러셀당 1~2개</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 광고 여부 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={adFlag === "Y"}
            onChange={(e) => setAdFlag(e.target.checked ? "Y" : "N")}
            disabled={messageType === "FL" || messageType === "FC"}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-medium text-gray-700">
            광고성 메시지 (08:00~20:00만 발송 가능)
          </span>
        </label>

        {/* FL/FC 타입 전용 경고 박스 */}
        {(messageType === "FL" || messageType === "FC") && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>FL/FC 타입은 광고 발송만 가능합니다.</strong>
              <p className="text-xs mt-1">해당 타입은 SMS 전환 발송도 지원하지 않습니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* 메시지 내용 - FT/FI 타입 */}
      {(messageType === "FT" || messageType === "FI") && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            메시지 내용
          </label>
          <div className="flex flex-col">
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="이곳에 문자 내용을 입력합니다&#10;치환문구 예시) #{이름}님 #{날짜} 방문 예약입니다."
              className="w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[300px]"
              maxLength={messageType === "FI" ? 400 : 1000}
            />

            {/* 하단 도구바 */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {/* 아이콘 버튼들 */}
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsVariableModalOpen(true)}
                  title="치환문구 추가"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsSaveModalOpen(true)}
                  title="템플릿 저장하기"
                >
                  <Save className="w-4 h-4" />
                </button>

                {/* 텍스트 버튼들 */}
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                  onClick={handleSavedContentClick}
                >
                  저장내용
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                  onClick={handleRecentSentClick}
                >
                  최근발송
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {message.length} / {messageType === "FI" ? "400" : "1,000"} 자
                </span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FW (와이드형) 레이아웃 */}
      {messageType === "FW" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">와이드형 메시지</h3>

          {/* 와이드 이미지 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>와이드 이미지 (필수)</span>
              </div>
            </label>
            {uploadedImages.length === 0 && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "업로드 중..." : "이미지 선택"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
              권장: 2:1 비율 (자동 크롭 지원), 최대 500KB
            </div>
            {uploadedImages.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <NextImage
                    src={uploadedImages[0].preview}
                    alt={uploadedImages[0].fileName}
                    width={64}
                    height={64}
                    className="object-cover rounded border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {uploadedImages[0].fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadedImages[0].fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveImage(0)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 메시지 (최대 76자) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              메시지 내용 (최대 76자, 줄바꿈 1개)
            </label>
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={(e) => {
                // 줄바꿈 개수 체크
                const lineBreaks = (e.target.value.match(/\n/g) || []).length;
                if (lineBreaks <= 1) {
                  setMessage(e.target.value);
                }
              }}
              placeholder="와이드 메시지 내용을 입력하세요&#10;치환문구 예시) #{이름}님 #{날짜} 방문 예약입니다."
              className="w-full p-3 border border-gray-300 rounded text-sm resize-none"
              rows={3}
              maxLength={76}
            />

            {/* 하단 도구바 */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {/* 아이콘 버튼들 */}
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsVariableModalOpen(true)}
                  title="치환문구 추가"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsSaveModalOpen(true)}
                  title="템플릿 저장하기"
                >
                  <Save className="w-4 h-4" />
                </button>

                {/* 텍스트 버튼들 */}
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                  onClick={handleSavedContentClick}
                >
                  저장내용
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                  onClick={handleRecentSentClick}
                >
                  최근발송
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {message.length} / 76자
                </span>
              </div>
            </div>
          </div>

          {/* imageLink (선택) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              이미지 링크 URL (선택)
            </label>
            <input
              type="url"
              value={imageLink}
              onChange={(e) => setImageLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <p className="text-xs text-gray-500">
              이미지 클릭 시 이동할 URL을 입력하세요
            </p>
          </div>
        </div>
      )}

      {/* FL (와이드 아이템 리스트형) 레이아웃 */}
      {messageType === "FL" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">와이드 아이템 리스트형</h3>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                onClick={() => setIsSaveModalOpen(true)}
                title="템플릿 저장하기"
              >
                <Save className="w-3.5 h-3.5" />
                저장
              </button>
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                onClick={handleSavedContentClick}
              >
                <FileText className="w-3.5 h-3.5" />
                저장내용
              </button>
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                onClick={handleRecentSentClick}
              >
                <Clock className="w-3.5 h-3.5" />
                최근발송
              </button>
            </div>
          </div>

          {/* 헤더 (최대 20자) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              헤더 (최대 20자, 줄바꿈 불가)
            </label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="리스트 헤더를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              maxLength={20}
            />
            <p className="text-xs text-gray-500">{headerText.length} / 20자</p>
          </div>

          {/* 아이템 리스트 (3-4개) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                아이템 리스트 (최소 3개, 최대 4개)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (listItems.length < 4) {
                      setListItems([
                        ...listItems,
                        { title: "", url_mobile: "", url_pc: "" },
                      ]);
                    }
                  }}
                  disabled={listItems.length >= 4}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + 아이템 추가
                </button>
                <button
                  onClick={() => {
                    if (listItems.length > 3) {
                      setListItems(listItems.slice(0, -1));
                    }
                  }}
                  disabled={listItems.length <= 3}
                  className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  - 아이템 삭제
                </button>
              </div>
            </div>

            {listItems.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 space-y-2"
              >
                <h4 className="text-sm font-medium text-gray-700">
                  아이템 {index + 1}
                </h4>

                {/* 아이템 제목 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    제목 (최대 25자, 줄바꿈 1개)
                  </label>
                  <textarea
                    value={item.title}
                    onChange={(e) => {
                      const lineBreaks = (e.target.value.match(/\n/g) || [])
                        .length;
                      if (lineBreaks <= 1) {
                        const newItems = [...listItems];
                        newItems[index].title = e.target.value;
                        setListItems(newItems);
                      }
                    }}
                    placeholder="아이템 제목"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                    rows={2}
                    maxLength={25}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {item.title.length} / 25자
                  </p>
                </div>

                {/* 아이템 이미지 (필수, 2:1 비율, 500px 이상) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    이미지 (필수, 2:1 비율 자동 크롭)
                  </label>
                  {!item.image ? (
                    <>
                      <button
                        className="w-full px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        onClick={() =>
                          listItemFileInputRefs.current[index]?.click()
                        }
                      >
                        이미지 선택
                      </button>
                      <input
                        ref={(el) => {
                          listItemFileInputRefs.current[index] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={(e) => handleListItemImageUpload(index, e)}
                        className="hidden"
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                      <NextImage
                        src={item.image.preview}
                        alt={item.image.fileName}
                        width={32}
                        height={32}
                        className="object-cover rounded"
                      />
                      <span className="text-xs flex-1 truncate">
                        {item.image.fileName}
                      </span>
                      <button
                        onClick={() => handleListItemImageRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 아이템 클릭 시 이동 URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    모바일 URL (필수)
                  </label>
                  <input
                    type="url"
                    value={item.url_mobile || ""}
                    onChange={(e) => {
                      const newItems = [...listItems];
                      newItems[index].url_mobile = e.target.value;
                      setListItems(newItems);
                    }}
                    placeholder="https://example.com/mobile"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    PC URL (선택)
                  </label>
                  <input
                    type="url"
                    value={item.url_pc || ""}
                    onChange={(e) => {
                      const newItems = [...listItems];
                      newItems[index].url_pc = e.target.value;
                      setListItems(newItems);
                    }}
                    placeholder="https://example.com/pc"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미지 업로드 - FI 타입만 */}
      {messageType === "FI" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>이미지 (필수)</span>
              </div>
            </label>
            {uploadedImages.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "업로드 중..." : "이미지 선택"}
              </button>
            )}
          </div>

          {/* 카카오 친구톡 이미지 규격 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800 space-y-1">
                <p className="font-medium">카카오 친구톡 이미지 안내</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-blue-700">
                  <li>
                    권장 비율: <strong>2:1 (가로:세로)</strong> - 예:
                    1000x500px, 800x400px
                  </li>
                  <li>최소 크기: 가로 500px 이상</li>
                  <li>파일 형식: JPG, PNG</li>
                  <li>최대 용량: 500KB (자동 최적화)</li>
                  <li className="text-amber-700 font-medium">
                    ⚠️ 2:1 비율이 아닌 이미지는 자동으로 중앙 기준 잘립니다
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* 업로드된 이미지 미리보기 */}
          {uploadedImages.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              {uploadedImages.map((image, index) => (
                <div key={index} className="flex items-center gap-3">
                  <NextImage
                    src={image.preview}
                    alt={image.fileName}
                    width={64}
                    height={64}
                    className="object-cover rounded border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {image.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(image.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-gray-700">
              <p>
                • 최대 1개, 5MB 이하, JPG/PNG 형식만 가능 (자동 최적화: 300KB
                이하)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FC (캐러셀형) 레이아웃 */}
      {messageType === "FC" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">캐러셀형</h3>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                onClick={() => setIsSaveModalOpen(true)}
                title="템플릿 저장하기"
              >
                <Save className="w-3.5 h-3.5" />
                저장
              </button>
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                onClick={handleSavedContentClick}
              >
                <FileText className="w-3.5 h-3.5" />
                저장내용
              </button>
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                onClick={handleRecentSentClick}
              >
                <Clock className="w-3.5 h-3.5" />
                최근발송
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              캐러셀 카드 (최소 2개, 최대 6개)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (carousels.length < 6) {
                    setCarousels([
                      ...carousels,
                      { header: "", content: "", buttons: [] },
                    ]);
                  }
                }}
                disabled={carousels.length >= 6}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + 카드 추가
              </button>
              <button
                onClick={() => {
                  if (carousels.length > 2) {
                    setCarousels(carousels.slice(0, -1));
                  }
                }}
                disabled={carousels.length <= 2}
                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                - 카드 삭제
              </button>
            </div>
          </div>

          {carousels.map((carousel, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 space-y-3"
            >
              <h4 className="text-sm font-medium text-gray-700">
                캐러셀 {index + 1}
              </h4>

              {/* 캐러셀 제목 (header) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  제목 (최대 20자)
                </label>
                <input
                  type="text"
                  value={carousel.header || ""}
                  onChange={(e) => {
                    const newCarousels = [...carousels];
                    newCarousels[index].header = e.target.value;
                    setCarousels(newCarousels);
                  }}
                  placeholder="캐러셀 제목"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(carousel.header || "").length} / 20자
                </p>
              </div>

              {/* 캐러셀 내용 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  내용 (최대 180자, 줄바꿈 2개)
                </label>
                <textarea
                  value={carousel.content}
                  onChange={(e) => {
                    const lineBreaks = (e.target.value.match(/\n/g) || [])
                      .length;
                    if (lineBreaks <= 2) {
                      const newCarousels = [...carousels];
                      newCarousels[index].content = e.target.value;
                      setCarousels(newCarousels);
                    }
                  }}
                  placeholder="캐러셀 내용"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  rows={4}
                  maxLength={180}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {carousel.content.length} / 180자
                </p>
              </div>

              {/* 캐러셀 이미지 (선택) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  이미지 (선택, 2:1 비율 자동 크롭)
                </label>
                {!carousel.image ? (
                  <>
                    <button
                      className="w-full px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      onClick={() =>
                        carouselFileInputRefs.current[index]?.click()
                      }
                    >
                      이미지 선택
                    </button>
                    <input
                      ref={(el) => {
                        carouselFileInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => handleCarouselImageUpload(index, e)}
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                    <NextImage
                      src={carousel.image.preview}
                      alt={carousel.image.fileName}
                      width={32}
                      height={32}
                      className="object-cover rounded"
                    />
                    <span className="text-xs flex-1 truncate">
                      {carousel.image.fileName}
                    </span>
                    <button
                      onClick={() => handleCarouselImageRemove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 캐러셀별 버튼 (1-2개) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  버튼 (최소 1개, 최대 2개)
                </label>
                {carousel.buttons.length === 0 ? (
                  <button
                    className="w-full px-3 py-2 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                    onClick={() => {
                      const newCarousels = [...carousels];
                      newCarousels[index].buttons.push({
                        name: "버튼",
                        type: "WL",
                        url_mobile: "",
                      });
                      setCarousels(newCarousels);
                    }}
                  >
                    + 버튼 추가
                  </button>
                ) : (
                  <div className="space-y-2">
                    {carousel.buttons.map((button, btnIndex) => (
                      <div
                        key={btnIndex}
                        className="bg-gray-50 p-2 rounded space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={button.name}
                            onChange={(e) => {
                              const newCarousels = [...carousels];
                              newCarousels[index].buttons[btnIndex].name =
                                e.target.value;
                              setCarousels(newCarousels);
                            }}
                            placeholder="버튼명 (최대 14자)"
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                            maxLength={14}
                          />
                          <select
                            value={button.type}
                            onChange={(e) => {
                              const newCarousels = [...carousels];
                              newCarousels[index].buttons[btnIndex].type =
                                e.target.value;
                              setCarousels(newCarousels);
                            }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded"
                          >
                            <option value="WL">웹링크</option>
                            <option value="AL">앱링크</option>
                            <option value="BK">봇키워드</option>
                            <option value="MD">메시지전달</option>
                          </select>
                          <button
                            onClick={() => {
                              const newCarousels = [...carousels];
                              newCarousels[index].buttons.splice(btnIndex, 1);
                              setCarousels(newCarousels);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {(button.type === "WL" || button.type === "AL") && (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={button.url_mobile || ""}
                              onChange={(e) => {
                                const newCarousels = [...carousels];
                                newCarousels[index].buttons[
                                  btnIndex
                                ].url_mobile = e.target.value;
                                setCarousels(newCarousels);
                              }}
                              placeholder={
                                button.type === "WL"
                                  ? "Mobile URL (필수)"
                                  : "App Scheme (필수)"
                              }
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                            {button.type === "WL" && (
                              <input
                                type="text"
                                value={button.url_pc || ""}
                                onChange={(e) => {
                                  const newCarousels = [...carousels];
                                  newCarousels[index].buttons[btnIndex].url_pc =
                                    e.target.value;
                                  setCarousels(newCarousels);
                                }}
                                placeholder="PC URL (선택)"
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {carousel.buttons.length < 2 && (
                      <button
                        className="w-full px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                        onClick={() => {
                          const newCarousels = [...carousels];
                          newCarousels[index].buttons.push({
                            name: "버튼",
                            type: "WL",
                            url_mobile: "",
                          });
                          setCarousels(newCarousels);
                        }}
                      >
                        + 버튼 추가
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 더보기 링크 (선택) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              더보기 링크 (선택)
            </label>
            <input
              type="url"
              value={moreLink}
              onChange={(e) => setMoreLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <p className="text-xs text-gray-500">
              더보기 버튼 클릭 시 이동할 URL
            </p>
          </div>
        </div>
      )}

      {/* 카카오톡 버튼 - FT/FI/FW/FL만 (FC는 캐러셀별 버튼 사용) */}
      {messageType !== "FC" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-gray-700">카카오톡 버튼</span>
            <span className="text-xs text-gray-500">
              (최대 {messageType === "FW" || messageType === "FL" ? "2" : "5"}
              개, WL/AL/BK/MD 지원)
            </span>
          </div>

          {buttons.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-gray-300 rounded">
              <button
                className="text-blue-600 text-sm hover:text-blue-700"
                onClick={() => setIsButtonModalOpen(true)}
              >
                + 버튼 추가
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {buttons.map((button, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium text-sm">{button.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({button.type})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setButtons(buttons.filter((_, i) => i !== index));
                    }}
                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                onClick={() => setIsButtonModalOpen(true)}
                disabled={
                  messageType === "FW" || messageType === "FL"
                    ? buttons.length >= 2
                    : buttons.length >= 5
                }
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                + 버튼 추가 ({buttons.length}/
                {messageType === "FW" || messageType === "FL" ? "2" : "5"})
              </button>
            </div>
          )}
        </div>
      )}

      {/* 문구 치환 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">문구 치환</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">
            {replaceableVariableCount === 0
              ? "내용에 치환 가능한 변수가 없습니다."
              : `${replaceableVariableCount}개의 변수가 자동으로 치환됩니다.`}
          </span>
        </div>
      </div>

      {/* SMS 백업 옵션 */}
      <div className="space-y-3 border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableSmsBackup}
            onChange={(e) => setEnableSmsBackup(e.target.checked)}
            disabled={messageType === "FL" || messageType === "FC"}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-medium text-gray-700">
            전환 전송 사용 (친구톡 실패 시 SMS로 자동 전환)
          </span>
        </label>

        {/* FL/FC 타입일 때 안내 메시지 */}
        {(messageType === "FL" || messageType === "FC") && (
          <p className="text-xs text-gray-500 ml-6">
            * FL/FC 타입은 광고 전용으로 SMS 전환 발송을 지원하지 않습니다.
          </p>
        )}

        {enableSmsBackup && (
          <div className="ml-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              전환 발송 메시지 (SMS)
            </label>
            <textarea
              value={smsBackupMessage}
              onChange={(e) => setSmsBackupMessage(e.target.value)}
              placeholder="친구톡 발송 실패 시 보낼 SMS 메시지"
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* 발송 버튼 제거 - MessageSendTab의 공통 전송/예약 준비 버튼 사용 */}

      {/* 템플릿 저장 모달 */}
      <SimpleContentSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentContent={{
          // FL/FC 타입은 message를 사용하지 않음 (빈 문자열)
          content: (messageType === "FL" || messageType === "FC") ? "" : message,
          messageType: "FRIENDTALK",
          buttons: buttons.length > 0 ? buttons : undefined,
          imageUrl:
            uploadedImages.length > 0 ? uploadedImages[0].fileId : undefined,
          imageLink: imageLink.trim() || undefined,
          // FW/FL/FC 타입 전용 필드
          friendtalkMessageType: messageType,
          headerText: headerText.trim() || undefined,
          listItems:
            messageType === "FL" && listItems.length > 0
              ? listItems
              : undefined,
          carousels:
            messageType === "FC" && carousels.length > 0
              ? carousels
              : undefined,
          moreLink: moreLink.trim() || undefined,
        }}
        onSaveSuccess={() => {
          setIsSaveModalOpen(false);
          // alert은 SimpleContentSaveModal에서 이미 표시하므로 제거
        }}
      />

      {/* 템플릿/최근발송 불러오기 모달 */}
      <LoadContentModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        initialActiveTab={loadModalActiveTab}
        messageTypeFilter="FRIENDTALK"
        friendtalkMessageTypeFilter={messageType}
        onSelect={(content) => {
          setMessage(content.content);
          if (content.buttons) setButtons(content.buttons);
          if (content.imageUrl) {
            // 이미지 복원
            setUploadedImages([
              {
                fileId: content.imageUrl,
                fileName: "불러온 이미지",
                fileSize: 0,
                preview: content.imageUrl,
              },
            ]);
          }
          if (content.imageLink) setImageLink(content.imageLink);

          // FW/FL/FC 타입 전용 필드 복원
          if (content.friendtalkMessageType) {
            setMessageType(content.friendtalkMessageType as MessageType);
          }
          if (content.headerText) {
            setHeaderText(content.headerText);
          }
          if (content.listItems && Array.isArray(content.listItems)) {
            // 이미지 preview를 fileId(Kakao URL)로 복원
            const restoredItems = content.listItems.map(item => ({
              ...item,
              image: item.image ? {
                ...item.image,
                preview: item.image.fileId  // Kakao URL을 preview로 사용
              } : undefined
            }));
            setListItems(restoredItems);
          }
          if (content.carousels && Array.isArray(content.carousels)) {
            // 이미지 preview를 fileId(Kakao URL)로 복원
            const restoredCarousels = content.carousels.map(carousel => ({
              ...carousel,
              image: carousel.image ? {
                ...carousel.image,
                preview: carousel.image.fileId  // Kakao URL을 preview로 사용
              } : undefined
            }));
            setCarousels(restoredCarousels);
          }
          if (content.moreLink) {
            setMoreLink(content.moreLink);
          }

          setIsLoadModalOpen(false);
        }}
      />

      {/* 버튼 추가/수정 모달 */}
      <FriendtalkButtonModal
        isOpen={isButtonModalOpen}
        onClose={() => setIsButtonModalOpen(false)}
        buttons={
          buttons as Array<{
            name: string;
            type: "WL";
            url_mobile: string;
            url_pc?: string;
          }>
        }
        onSave={(newButtons) => {
          setButtons(
            newButtons as Array<{
              name: string;
              type: string;
              url_mobile?: string;
              url_pc?: string;
            }>,
          );
          setIsButtonModalOpen(false);
        }}
      />

      {/* 변수 선택 모달 */}
      <VariableSelectModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
        onSelect={handleVariableSelect}
      />
    </div>
  );
};

export default FriendtalkTab;
