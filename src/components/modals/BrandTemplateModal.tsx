"use client";

import React, { useState, useRef } from "react";
import NextImage from "next/image";
import { X, Upload, Trash2 } from "lucide-react";

interface UploadedFile {
  fileId: string;
  url: string;
  name: string;
}

interface BrandButton {
  name: string;           // 버튼명 (최대 14자)
  type: 'WL';            // 웹링크 (WL만 지원)
  url_mobile: string;    // 모바일 URL (필수)
  url_pc?: string;       // PC URL (선택)
}

interface BrandTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  senderKey: string;
}

const BrandTemplateModal: React.FC<BrandTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  senderKey,
}) => {
  const [name, setName] = useState("");
  const [chatBubbleType, setChatBubbleType] = useState<"TEXT" | "IMAGE" | "WIDE" | "WIDE_ITEM_LIST" | "CAROUSEL_FEED" | "PREMIUM_VIDEO" | "COMMERCE" | "CAROUSEL_COMMERCE">("TEXT");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [buttons, setButtons] = useState<BrandButton[]>([]);

  // PREMIUM_VIDEO용 state
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadedVideo, setUploadedVideo] = useState<UploadedFile | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<UploadedFile | null>(null);

  // COMMERCE용 state
  const [commerceTitle, setCommerceTitle] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountType, setDiscountType] = useState<'rate' | 'fixed'>('rate'); // 할인 타입 선택
  const [discountRate, setDiscountRate] = useState("");
  const [discountFixed, setDiscountFixed] = useState("");
  const [uploadedCommerceImage, setUploadedCommerceImage] = useState<UploadedFile | null>(null);

  // WIDE_ITEM_LIST용 state (다중 아이템)
  interface WideListItem {
    id: string;
    img_url: string;
    url_mobile: string;
    title: string;
    uploadedFile: UploadedFile | null;
  }
  const [wideListItems, setWideListItems] = useState<WideListItem[]>([]);

  // CAROUSEL_COMMERCE용 state (다중 상품 카드)
  interface CarouselCommerceCard {
    id: string;
    img_url: string;
    url_mobile: string;
    commerce_title: string;
    description: string;
    regular_price: number;
    discount_price?: number;
    discount_type: 'rate' | 'fixed'; // 할인 타입 선택
    discount_rate?: number;
    discount_fixed?: number;
    uploadedFile: UploadedFile | null;
  }
  const [carouselCommerceCards, setCarouselCommerceCards] = useState<CarouselCommerceCard[]>([]);

  // CAROUSEL_FEED용 state (다중 피드 카드)
  interface CarouselFeedCard {
    id: string;
    img_url: string;
    url_mobile: string;
    title: string;
    description: string;
    uploadedFile: UploadedFile | null;
    buttons: Array<{
      name: string;
      type: string;
      url_mobile?: string;
      url_pc?: string;
    }>;
  }
  const [carouselFeedCards, setCarouselFeedCards] = useState<CarouselFeedCard[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const commerceImageInputRef = useRef<HTMLInputElement>(null);

  // 메시지 타입별 최대 버튼 개수
  const maxButtons: Record<typeof chatBubbleType, number> = {
    TEXT: 5,
    IMAGE: 5,
    WIDE: 2,
    WIDE_ITEM_LIST: 2,
    CAROUSEL_FEED: 0, // 캐러셀은 버튼 미지원
    PREMIUM_VIDEO: 1,
    COMMERCE: 2,
    CAROUSEL_COMMERCE: 0, // 캐러셀은 버튼 미지원
  };

  if (!isOpen) return null;

  // 이미지 파일 업로드 핸들러 (카카오 서버에 업로드)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPG, JPEG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", senderKey);

      // 카카오 이미지 서버에 업로드
      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "이미지 업로드 실패");
      }

      // 업로드된 이미지 정보 저장
      setUploadedImage({
        fileId: result.fileId,
        url: result.url,
        name: file.name,
      });

      // imageUrl도 함께 업데이트
      setImageUrl(result.url);

    } catch (err) {
      console.error("이미지 업로드 오류:", err);
      setError(err instanceof Error ? err.message : "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 업로드된 이미지 삭제
  const handleDeleteImage = () => {
    setUploadedImage(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 비디오 파일 업로드 핸들러 (Supabase Storage에 업로드)
  // 카카오 TV URL 검증 함수
  const validateKakaoTvUrl = (url: string): boolean => {
    const kakaoTvPattern = /^https:\/\/tv\.kakao\.com\/(v\/\d+|channel\/\d+\/cliplink\/\d+)$/;
    return kakaoTvPattern.test(url);
  };

  // 업로드된 비디오 삭제
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteVideo = () => {
    setUploadedVideo(null);
    setVideoUrl("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // 썸네일 이미지 업로드 핸들러 (카카오 서버에 업로드)
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPG, JPEG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", senderKey);

      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "썸네일 업로드 실패");
      }

      setUploadedThumbnail({
        fileId: result.fileId,
        url: result.url,
        name: file.name,
      });

      setThumbnailUrl(result.url);

    } catch (err) {
      console.error("썸네일 업로드 오류:", err);
      setError(err instanceof Error ? err.message : "썸네일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 업로드된 썸네일 삭제
  const handleDeleteThumbnail = () => {
    setUploadedThumbnail(null);
    setThumbnailUrl("");
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  // 커머스 이미지 업로드 핸들러 (카카오 서버에 업로드)
  const handleCommerceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPG, JPEG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", senderKey);

      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "이미지 업로드 실패");
      }

      setUploadedCommerceImage({
        fileId: result.fileId,
        url: result.url,
        name: file.name,
      });

      setImageUrl(result.url);

    } catch (err) {
      console.error("커머스 이미지 업로드 오류:", err);
      setError(err instanceof Error ? err.message : "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 업로드된 커머스 이미지 삭제
  const handleDeleteCommerceImage = () => {
    setUploadedCommerceImage(null);
    setImageUrl("");
    if (commerceImageInputRef.current) {
      commerceImageInputRef.current.value = "";
    }
  };

  // 버튼 추가
  const handleAddButton = () => {
    const max = maxButtons[chatBubbleType];
    if (max === 0) {
      setError("이 메시지 타입은 버튼을 지원하지 않습니다.");
      return;
    }
    if (buttons.length >= max) {
      setError(`${chatBubbleType} 타입은 최대 ${max}개의 버튼까지 추가할 수 있습니다.`);
      return;
    }
    setButtons([...buttons, { name: "", type: "WL", url_mobile: "", url_pc: "" }]);
    setError("");
  };

  // 버튼 삭제
  const handleDeleteButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  // 버튼 정보 수정
  const handleButtonChange = (index: number, field: keyof BrandButton, value: string) => {
    // 버튼명 길이 제한
    if (field === "name" && value.length > 14) {
      setError("버튼명은 최대 14자까지 입력 가능합니다.");
      return;
    }

    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
    setError("");
  };

  // WIDE_ITEM_LIST 아이템 추가
  const handleAddWideListItem = () => {
    if (wideListItems.length >= 4) {
      setError("최대 4개의 아이템까지 추가할 수 있습니다. (메인 1개 + 서브 3개)");
      return;
    }
    const newItem: WideListItem = {
      id: Date.now().toString(),
      img_url: "",
      url_mobile: "",
      title: "",
      uploadedFile: null,
    };
    setWideListItems([...wideListItems, newItem]);
    setError("");
  };

  // WIDE_ITEM_LIST 아이템 삭제 (최소 3개 유지)
  const handleDeleteWideListItem = (id: string) => {
    if (wideListItems.length <= 3) {
      setError("WIDE_ITEM_LIST는 최소 3개의 아이템이 필요합니다.");
      return;
    }
    setWideListItems(wideListItems.filter(item => item.id !== id));
    setError("");
  };

  // WIDE_ITEM_LIST 아이템 정보 수정
  const handleWideListItemChange = (id: string, field: 'url_mobile' | 'title', value: string) => {
    setWideListItems(wideListItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // WIDE_ITEM_LIST 첫 번째 아이템: 2:1 비율로 자동 크롭 (최소 800x400px)
  const cropMainItemTo2x1 = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context 생성 실패'));
            return;
          }

          // 2:1 비율 확보, 최소 800x400px
          const targetWidth = Math.max(800, img.width);
          const targetHeight = targetWidth / 2;

          // 원본에서 2:1 비율로 크롭 (중앙 기준)
          let srcWidth = img.width;
          let srcHeight = img.width / 2;
          let srcX = 0;
          let srcY = (img.height - srcHeight) / 2;

          // 이미지가 너무 작으면 최대한 활용
          if (srcHeight > img.height) {
            srcHeight = img.height;
            srcWidth = img.height * 2;
            srcX = (img.width - srcWidth) / 2;
            srcY = 0;
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, targetWidth, targetHeight);

          canvas.toBlob((blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(croppedFile);
            } else {
              reject(new Error('이미지 크롭 실패'));
            }
          }, file.type);
        };
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  };

  // WIDE_ITEM_LIST 서브 아이템: 1:1 비율로 자동 크롭 (최소 500x500px)
  const cropSubItemTo1x1 = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context 생성 실패'));
            return;
          }

          // 1:1 비율로 크롭, 최소 500x500px 보장
          const size = Math.max(500, Math.min(img.width, img.height));
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;

          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

          canvas.toBlob((blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(croppedFile);
            } else {
              reject(new Error('이미지 크롭 실패'));
            }
          }, file.type);
        };
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  };

  // WIDE_ITEM_LIST 아이템 이미지 업로드
  // 첫 번째 아이템(메인): 2:1 비율, 나머지(서브): 1:1 비율
  const handleWideListItemImageUpload = async (id: string, file: File) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPG, JPEG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      // 첫 번째 아이템인지 확인
      const itemIndex = wideListItems.findIndex(item => item.id === id);
      const isMainItem = itemIndex === 0;

      // 첫 번째 아이템: 2:1 비율 크롭, 나머지: 1:1 비율 크롭
      const croppedFile = isMainItem
        ? await cropMainItemTo2x1(file)
        : await cropSubItemTo1x1(file);

      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("isFirst", isMainItem ? "true" : "false");

      // WIDE_ITEM_LIST 전용 이미지 업로드 API 사용
      const response = await fetch("/api/messages/kakao/brand/upload-wide-item-image", {
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

      const result = await response.json();

      if (result.success && result.url) {
        setWideListItems(wideListItems.map(item =>
          item.id === id
            ? {
                ...item,
                img_url: result.url,
                uploadedFile: {
                  fileId: result.fileId || result.url,
                  url: result.url,
                  name: file.name,
                },
              }
            : item
        ));
      } else {
        throw new Error(result.error || "이미지 업로드 실패");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // WIDE_ITEM_LIST 아이템 이미지 삭제
  const handleDeleteWideListItemImage = (id: string) => {
    setWideListItems(wideListItems.map(item =>
      item.id === id
        ? { ...item, img_url: "", uploadedFile: null }
        : item
    ));
  };

  // ==================== CAROUSEL_COMMERCE 핸들러 ====================

  // CAROUSEL_COMMERCE 카드 추가
  const handleAddCarouselCommerceCard = () => {
    if (carouselCommerceCards.length >= 10) {
      setError("최대 10개의 카드까지 추가할 수 있습니다.");
      return;
    }
    const newCard: CarouselCommerceCard = {
      id: Date.now().toString(),
      img_url: "",
      url_mobile: "",
      commerce_title: "",
      description: "",
      regular_price: 0,
      discount_price: undefined,
      discount_type: 'rate', // 기본값: 할인율
      discount_rate: undefined,
      discount_fixed: undefined,
      uploadedFile: null,
    };
    setCarouselCommerceCards([...carouselCommerceCards, newCard]);
    setError("");
  };

  // CAROUSEL_COMMERCE 카드 삭제
  const handleDeleteCarouselCommerceCard = (id: string) => {
    setCarouselCommerceCards(carouselCommerceCards.filter(card => card.id !== id));
  };

  // CAROUSEL_COMMERCE 카드 정보 수정
  const handleCarouselCommerceCardChange = (
    id: string,
    field: keyof Omit<CarouselCommerceCard, 'id' | 'uploadedFile'>,
    value: string | number | undefined
  ) => {
    setCarouselCommerceCards(carouselCommerceCards.map(card =>
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  // CAROUSEL_COMMERCE 카드 이미지 업로드
  const handleCarouselCommerceCardImageUpload = async (id: string, file: File) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPG, JPEG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", senderKey);
      // CAROUSEL_COMMERCE는 2:1 비율 (cropRatio 미지정 시 기본값 2:1 사용)

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

      const result = await response.json();

      if (result.success && result.url) {
        setCarouselCommerceCards(carouselCommerceCards.map(card =>
          card.id === id
            ? {
                ...card,
                img_url: result.url,
                uploadedFile: {
                  fileId: result.fileId || result.url,
                  url: result.url,
                  name: file.name,
                },
              }
            : card
        ));
      } else {
        throw new Error(result.error || "이미지 업로드 실패");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // CAROUSEL_COMMERCE 카드 이미지 삭제
  const handleDeleteCarouselCommerceCardImage = (id: string) => {
    setCarouselCommerceCards(carouselCommerceCards.map(card =>
      card.id === id
        ? { ...card, img_url: "", uploadedFile: null }
        : card
    ));
  };

  // ==================== CAROUSEL_FEED 핸들러 ====================

  // CAROUSEL_FEED 카드 추가
  const handleAddCarouselFeedCard = () => {
    if (carouselFeedCards.length >= 10) {
      setError("최대 10개의 카드까지 추가할 수 있습니다.");
      return;
    }
    const newCard: CarouselFeedCard = {
      id: Date.now().toString(),
      img_url: "",
      url_mobile: "",
      title: "",
      description: "",
      uploadedFile: null,
      buttons: [
        {
          name: "자세히 보기",
          type: "WL",
          url_mobile: "",
        }
      ],
    };
    setCarouselFeedCards([...carouselFeedCards, newCard]);
    setError("");
  };

  // CAROUSEL_FEED 카드 삭제
  const handleDeleteCarouselFeedCard = (id: string) => {
    setCarouselFeedCards(carouselFeedCards.filter(card => card.id !== id));
  };

  // CAROUSEL_FEED 카드 정보 수정
  const handleCarouselFeedCardChange = (
    id: string,
    field: keyof Omit<CarouselFeedCard, 'id' | 'uploadedFile'>,
    value: string
  ) => {
    setCarouselFeedCards(carouselFeedCards.map(card =>
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  // CAROUSEL_FEED 카드 이미지 업로드
  const handleCarouselFeedCardImageUpload = async (id: string, file: File) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPG, JPEG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", senderKey);
      // CAROUSEL_FEED는 2:1 비율 (cropRatio 미지정 시 기본값 2:1 사용)

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

      const result = await response.json();

      if (result.success && result.url) {
        setCarouselFeedCards(carouselFeedCards.map(card =>
          card.id === id
            ? {
                ...card,
                img_url: result.url,
                uploadedFile: {
                  fileId: result.fileId || result.url,
                  url: result.url,
                  name: file.name,
                },
              }
            : card
        ));
      } else {
        throw new Error(result.error || "이미지 업로드 실패");
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // CAROUSEL_FEED 카드 이미지 삭제
  const handleDeleteCarouselFeedCardImage = (id: string) => {
    setCarouselFeedCards(carouselFeedCards.map(card =>
      card.id === id
        ? { ...card, img_url: "", uploadedFile: null }
        : card
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      // WIDE_ITEM_LIST 최소 아이템 검증
      if (chatBubbleType === "WIDE_ITEM_LIST" && wideListItems.length < 3) {
        setError("WIDE_ITEM_LIST는 최소 3개의 아이템이 필요합니다. (메인 아이템 1개 + 서브 아이템 2개)");
        setIsSubmitting(false);
        return;
      }

      // PREMIUM_VIDEO 카카오 TV URL 검증
      if (chatBubbleType === "PREMIUM_VIDEO") {
        if (!videoUrl || !validateKakaoTvUrl(videoUrl)) {
          setError("올바른 카카오 TV URL을 입력해주세요.\n형식: https://tv.kakao.com/v/숫자 또는 https://tv.kakao.com/channel/숫자/cliplink/숫자");
          setIsSubmitting(false);
          return;
        }
      }

      // 버튼 검증
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];

        // 필수 필드 검증
        if (!button.name.trim()) {
          setError(`버튼 ${i + 1}: 버튼명을 입력해주세요.`);
          setIsSubmitting(false);
          return;
        }

        if (!button.url_mobile.trim()) {
          setError(`버튼 ${i + 1}: 모바일 URL을 입력해주세요.`);
          setIsSubmitting(false);
          return;
        }

        // URL 형식 검증
        try {
          new URL(button.url_mobile);
          if (button.url_pc && button.url_pc.trim()) {
            new URL(button.url_pc);
          }
        } catch {
          setError(`버튼 ${i + 1}: 올바른 URL 형식이 아닙니다.`);
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch("/api/messages/kakao/brand/templates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderKey,
          name,
          chatBubbleType,
          content,
          imageUrl: imageUrl || undefined,
          imageLink: imageLink || undefined,
          buttons: buttons.length > 0 ? buttons : undefined,
          // PREMIUM_VIDEO 필드
          videoUrl: videoUrl || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          // COMMERCE 필드
          commerceTitle: commerceTitle || undefined,
          regularPrice: regularPrice ? parseInt(regularPrice) : undefined,
          discountPrice: discountPrice ? parseInt(discountPrice) : undefined,
          discountRate: discountRate ? parseInt(discountRate) : undefined,
          discountFixed: discountFixed ? parseInt(discountFixed) : undefined,
          // WIDE_ITEM_LIST 필드
          items: wideListItems.length > 0 ? wideListItems.map(item => ({
            img_url: item.img_url,
            url_mobile: item.url_mobile,
            title: item.title,
          })) : undefined,
          // CAROUSEL_COMMERCE, CAROUSEL_FEED 필드
          carouselCards: (carouselCommerceCards.length > 0 || carouselFeedCards.length > 0)
            ? (chatBubbleType === 'CAROUSEL_COMMERCE'
                ? carouselCommerceCards.map(card => ({
                    img_url: card.img_url,
                    url_mobile: card.url_mobile,
                    commerce_title: card.commerce_title,
                    description: card.description,
                    regular_price: card.regular_price,
                    discount_price: card.discount_price,
                    discount_rate: card.discount_rate,
                    discount_fixed: card.discount_fixed,
                  }))
                : carouselFeedCards.map(card => ({
                    img_url: card.img_url,
                    url_mobile: card.url_mobile,
                    title: card.title,
                    description: card.description,
                    buttons: card.buttons,
                  }))
              )
            : undefined,
          adult: false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "템플릿 생성 실패");
      }

      alert("브랜드 템플릿이 성공적으로 등록되었습니다!");

      // 폼 초기화
      setName("");
      setContent("");
      setImageUrl("");
      setImageLink("");
      setUploadedImage(null);
      setButtons([]);
      setVideoUrl("");
      setThumbnailUrl("");
      setUploadedVideo(null);
      setUploadedThumbnail(null);
      setCommerceTitle("");
      setRegularPrice("");
      setDiscountPrice("");
      setDiscountRate("");
      setDiscountFixed("");
      setUploadedCommerceImage(null);
      setWideListItems([]);
      setCarouselCommerceCards([]);
      setCarouselFeedCards([]);
      setChatBubbleType("TEXT");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = "";
      }
      if (commerceImageInputRef.current) {
        commerceImageInputRef.current.value = "";
      }

      onSuccess();
    } catch (err) {
      console.error("템플릿 생성 오류:", err);
      setError(err instanceof Error ? err.message : "템플릿 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            브랜드 메시지 템플릿 등록
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 템플릿 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 신상품 출시 안내"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 메시지 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메시지 타입 <span className="text-red-500">*</span>
            </label>
            <select
              value={chatBubbleType}
              onChange={(e) => {
                const newType = e.target.value as typeof chatBubbleType;
                setChatBubbleType(newType);

                // WIDE_ITEM_LIST 선택 시 자동으로 3개 아이템 생성
                if (newType === "WIDE_ITEM_LIST" && wideListItems.length === 0) {
                  const initialItems: WideListItem[] = Array.from({ length: 3 }, (_, i) => ({
                    id: `${Date.now()}-${i}`,
                    img_url: "",
                    url_mobile: "",
                    title: "",
                    uploadedFile: null,
                  }));
                  setWideListItems(initialItems);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TEXT">텍스트형 (TEXT)</option>
              <option value="IMAGE">이미지형 (IMAGE)</option>
              <option value="WIDE">와이드형 (WIDE)</option>
              <option value="WIDE_ITEM_LIST">와이드리스트형 (WIDE_ITEM_LIST)</option>
              <option value="CAROUSEL_FEED">캐러셀피드형 (CAROUSEL_FEED)</option>
              <option value="PREMIUM_VIDEO">프리미엄동영상형 (PREMIUM_VIDEO)</option>
              <option value="COMMERCE">커머스형 (COMMERCE)</option>
              <option value="CAROUSEL_COMMERCE">캐러셀커머스형 (CAROUSEL_COMMERCE)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              MTS API v1.1 기준 8가지 타입 전부 지원
            </p>
          </div>

          {/* 메시지 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메시지 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`예: #{고객명}님, 안녕하세요!\n#{날짜}에 새로운 혜택을 준비했습니다.\n\n지원 변수: #{이름}, #{고객명}, #{성함}, #{날짜}, #{오늘날짜}, #{시간}, #{현재시간}, #{회사명}, #{담당자명} 등`}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              변수 형식: #{"{변수명}"} (예: #{"{고객명}"}님 안녕하세요)
            </p>
          </div>

          {/* 이미지 업로드 (IMAGE, WIDE 타입일 때만) */}
          {(chatBubbleType === "IMAGE" || chatBubbleType === "WIDE") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 첨부 {chatBubbleType === "IMAGE" && <span className="text-red-500">*</span>}
                </label>

                {/* 파일 업로드 버튼 */}
                {!uploadedImage && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {isUploading ? "업로드 중..." : "이미지 선택 (JPG, JPEG, PNG)"}
                        </span>
                        <span className="text-xs text-gray-500">
                          권장: 800x400px (2:1 비율), 최대 5MB
                        </span>
                      </div>
                    </button>
                  </>
                )}

                {/* 이미지 미리보기 */}
                {uploadedImage && (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <NextImage
                        src={uploadedImage.url}
                        alt="업로드된 이미지"
                        width={128}
                        height={64}
                        className="object-cover rounded border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {uploadedImage.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          {uploadedImage.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="이미지 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 클릭 시 이동 URL (선택)
                </label>
                <input
                  type="url"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  placeholder="https://example.com/promotion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  이미지를 클릭했을 때 이동할 웹페이지 URL을 입력하세요
                </p>
              </div>
            </>
          )}

          {/* PREMIUM_VIDEO: 카카오 TV URL 입력 + 썸네일 업로드 */}
          {chatBubbleType === "PREMIUM_VIDEO" && (
            <>
              {/* 카카오 TV 업로드 안내 */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  ℹ️ 카카오 TV 영상 URL 입력 방법
                </p>
                <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>
                    <a
                      href="https://tv.kakao.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      카카오 TV
                    </a>에 먼저 영상을 업로드하세요
                  </li>
                  <li>업로드된 영상의 URL을 복사하세요 (예: https://tv.kakao.com/v/123456)</li>
                  <li>아래 입력란에 URL을 붙여넣으세요</li>
                </ol>
              </div>

              {/* 비디오 URL 입력 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카카오 TV 영상 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://tv.kakao.com/v/123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {videoUrl && !validateKakaoTvUrl(videoUrl) && (
                  <p className="text-xs text-red-500 mt-1">
                    ❌ 올바른 카카오 TV URL 형식이 아닙니다 (https://tv.kakao.com/v/숫자)
                  </p>
                )}
                {videoUrl && validateKakaoTvUrl(videoUrl) && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ 올바른 URL 형식입니다
                  </p>
                )}
              </div>

              {/* 썸네일 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  썸네일 이미지 <span className="text-red-500">*</span>
                </label>

                {!uploadedThumbnail && (
                  <>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {isUploading ? "업로드 중..." : "썸네일 이미지 선택 (JPG, PNG)"}
                        </span>
                        <span className="text-xs text-gray-500">
                          권장: 800x400px (2:1 비율), 최대 5MB
                        </span>
                      </div>
                    </button>
                  </>
                )}

                {uploadedThumbnail && (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <NextImage
                        src={uploadedThumbnail.url}
                        alt="썸네일"
                        width={128}
                        height={64}
                        className="object-cover rounded border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {uploadedThumbnail.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          {uploadedThumbnail.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteThumbnail}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="썸네일 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* WIDE_ITEM_LIST: 헤더 텍스트 + 다중 아이템 리스트 */}
          {chatBubbleType === "WIDE_ITEM_LIST" && (
            <>
              {/* 안내 문구 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>첫 번째 아이템</strong>이 메시지 상단에 크게 표시됩니다 (2:1 비율, 800x400px)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  나머지 아이템들은 하단에 작게 표시됩니다 (1:1 비율, 500x500px)
                </p>
              </div>

              {/* 리스트 아이템 관리 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    리스트 아이템 ({wideListItems.length}/4) <span className="text-red-500">*최소 3개</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddWideListItem}
                    disabled={wideListItems.length >= 4}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    + 아이템 추가
                  </button>
                </div>

                {wideListItems.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    WIDE_ITEM_LIST 선택 시 자동으로 3개 아이템이 생성됩니다
                  </div>
                )}

                {wideListItems.map((item, index) => (
                  <div key={item.id} className="border border-gray-300 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        아이템 {index + 1} {index === 0 ? "(메인)" : "(서브)"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteWideListItem(item.id)}
                        disabled={wideListItems.length <= 3}
                        className="text-red-500 hover:text-red-700 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                        title={wideListItems.length <= 3 ? "최소 3개 아이템이 필요합니다" : "삭제"}
                      >
                        삭제
                      </button>
                    </div>

                    {/* 아이템 썸네일 이미지 */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        썸네일 이미지 <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 font-normal ml-1">
                          {index === 0 ? "(2:1 비율, 800x400px)" : "(1:1 비율, 500x500px)"}
                        </span>
                      </label>
                      {!item.uploadedFile && (
                        <>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleWideListItemImageUpload(item.id, file);
                              }
                            }}
                            className="hidden"
                            id={`item-image-${item.id}`}
                          />
                          <label
                            htmlFor={`item-image-${item.id}`}
                            className="block w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-600"
                          >
                            {isUploading ? "업로드 중..." : (index === 0 ? "이미지 선택 (자동으로 2:1 비율 크롭)" : "이미지 선택 (자동으로 1:1 비율 크롭)")}
                          </label>
                        </>
                      )}
                      {item.uploadedFile && (
                        <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                          <NextImage
                            src={item.uploadedFile.url}
                            alt={`아이템 ${index + 1}`}
                            width={64}
                            height={64}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-xs text-gray-600 flex-1 truncate">{item.uploadedFile.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteWideListItemImage(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 아이템 제목 */}
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        아이템 제목
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleWideListItemChange(item.id, 'title', e.target.value)}
                        placeholder="예: 시원한 홈캉스룩!"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* 아이템 클릭 URL */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        클릭 시 이동 URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={item.url_mobile}
                        onChange={(e) => handleWideListItemChange(item.id, 'url_mobile', e.target.value)}
                        placeholder="https://example.com/item"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* COMMERCE: 상품 이미지 + 정보 입력 (단일 상품) */}
          {chatBubbleType === "COMMERCE" && (
            <>
              {/* 상품 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품 이미지 <span className="text-red-500">*</span>
                </label>

                {!uploadedCommerceImage && (
                  <>
                    <input
                      ref={commerceImageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleCommerceImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => commerceImageInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {isUploading ? "업로드 중..." : "상품 이미지 선택 (JPG, PNG)"}
                        </span>
                        <span className="text-xs text-gray-500">
                          권장: 정사각형 (1:1 비율), 최대 5MB
                        </span>
                      </div>
                    </button>
                  </>
                )}

                {uploadedCommerceImage && (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <NextImage
                        width={128}
                        height={64}
                        src={uploadedCommerceImage.url}
                        alt="상품 이미지"
                        className="w-32 h-32 object-cover rounded border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {uploadedCommerceImage.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          {uploadedCommerceImage.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteCommerceImage}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="이미지 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={commerceTitle}
                  onChange={(e) => setCommerceTitle(e.target.value)}
                  placeholder="프리미엄 노트북"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    정가 (원) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    placeholder="1500000"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    할인가 (원)
                  </label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="1200000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 할인 타입 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  할인 타입 선택 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="rate"
                      checked={discountType === 'rate'}
                      onChange={(e) => {
                        setDiscountType(e.target.value as 'rate' | 'fixed');
                        setDiscountFixed(""); // 다른 필드 초기화
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">할인율 (%)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      checked={discountType === 'fixed'}
                      onChange={(e) => {
                        setDiscountType(e.target.value as 'rate' | 'fixed');
                        setDiscountRate(""); // 다른 필드 초기화
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">정액할인 (원)</span>
                  </label>
                </div>
              </div>

              {/* 할인 입력 필드 (선택된 타입에 따라 표시) */}
              <div>
                {discountType === 'rate' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      할인율 (%)
                    </label>
                    <input
                      type="number"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(e.target.value)}
                      placeholder="20"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      정액할인 (원)
                    </label>
                    <input
                      type="number"
                      value={discountFixed}
                    onChange={(e) => setDiscountFixed(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  </div>
                )}
              </div>
            </>
          )}

          {/* CAROUSEL_COMMERCE: 다중 상품 카드 입력 */}
          {chatBubbleType === "CAROUSEL_COMMERCE" && (
            <>
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  ℹ️ 모든 상품 이미지는 자동으로 <strong>2:1 비율 (가로:세로)</strong>로 조정됩니다. (비율 걱정 없이 업로드하세요)
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    캐러셀 상품 카드 <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(최대 10개)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCarouselCommerceCard}
                    disabled={carouselCommerceCards.length >= 10}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    + 카드 추가
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  카드 수: {carouselCommerceCards.length}개
                </p>

                {carouselCommerceCards.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      &quot;+ 카드 추가&quot; 버튼을 클릭하여 상품 카드를 추가하세요
                    </p>
                  </div>
                )}

                {carouselCommerceCards.map((card, index) => (
                  <div key={card.id} className="border border-gray-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">카드 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCarouselCommerceCard(card.id)}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* 카드 이미지 업로드 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          상품 이미지 <span className="text-red-500">*</span>
                        </label>
                        {!card.uploadedFile && (
                          <>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleCarouselCommerceCardImageUpload(card.id, file);
                                }
                              }}
                              className="hidden"
                              id={`carousel-commerce-image-${card.id}`}
                            />
                            <label
                              htmlFor={`carousel-commerce-image-${card.id}`}
                              className="block w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer text-center"
                            >
                              <span className="text-sm text-gray-600">
                                {isUploading ? "업로드 중..." : "이미지 선택 (JPG, PNG)"}
                              </span>
                            </label>
                          </>
                        )}
                        {card.uploadedFile && (
                          <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                            <NextImage
                              src={card.uploadedFile.url}
                              alt={`카드 ${index + 1}`}
                              width={64}
                              height={64}
                              className="object-cover rounded"
                            />
                            <span className="text-xs text-gray-600 flex-1 truncate">
                              {card.uploadedFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCarouselCommerceCardImage(card.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 클릭 URL */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          클릭 시 이동 URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={card.url_mobile}
                          onChange={(e) => handleCarouselCommerceCardChange(card.id, 'url_mobile', e.target.value)}
                          placeholder="https://example.com/product"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* 상품명 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          상품명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={card.commerce_title}
                          onChange={(e) => handleCarouselCommerceCardChange(card.id, 'commerce_title', e.target.value)}
                          placeholder="프리미엄 노트북"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* 설명 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          상품 설명 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={card.description}
                          onChange={(e) => handleCarouselCommerceCardChange(card.id, 'description', e.target.value)}
                          placeholder="무더위? 귀여움으로 쿨하게 극복!"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>

                      {/* 가격 정보 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            정가 (원) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={card.regular_price || ''}
                            onChange={(e) => handleCarouselCommerceCardChange(card.id, 'regular_price', parseInt(e.target.value) || 0)}
                            placeholder="49900"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            할인가 (원)
                          </label>
                          <input
                            type="number"
                            value={card.discount_price || ''}
                            onChange={(e) => handleCarouselCommerceCardChange(card.id, 'discount_price', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="39900"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      {/* 할인 타입 선택 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          할인 타입 선택 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4 mb-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="rate"
                              checked={card.discount_type === 'rate'}
                              onChange={(e) => {
                                const updatedCards = carouselCommerceCards.map(c =>
                                  c.id === card.id
                                    ? { ...c, discount_type: e.target.value as 'rate' | 'fixed', discount_fixed: undefined }
                                    : c
                                );
                                setCarouselCommerceCards(updatedCards);
                              }}
                              className="mr-1.5"
                            />
                            <span className="text-xs text-gray-700">할인율 (%)</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="fixed"
                              checked={card.discount_type === 'fixed'}
                              onChange={(e) => {
                                const updatedCards = carouselCommerceCards.map(c =>
                                  c.id === card.id
                                    ? { ...c, discount_type: e.target.value as 'rate' | 'fixed', discount_rate: undefined }
                                    : c
                                );
                                setCarouselCommerceCards(updatedCards);
                              }}
                              className="mr-1.5"
                            />
                            <span className="text-xs text-gray-700">정액할인 (원)</span>
                          </label>
                        </div>

                        {/* 할인 입력 필드 (선택된 타입에 따라) */}
                        {card.discount_type === 'rate' ? (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              할인율 (%)
                            </label>
                            <input
                              type="number"
                              value={card.discount_rate || ''}
                              onChange={(e) => handleCarouselCommerceCardChange(card.id, 'discount_rate', e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="20"
                              min="0"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              정액할인 (원)
                            </label>
                            <input
                              type="number"
                              value={card.discount_fixed || ''}
                              onChange={(e) => handleCarouselCommerceCardChange(card.id, 'discount_fixed', e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="5000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CAROUSEL_FEED: 다중 피드 카드 입력 */}
          {chatBubbleType === "CAROUSEL_FEED" && (
            <>
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  ℹ️ 모든 피드 이미지는 자동으로 <strong>2:1 비율 (가로:세로)</strong>로 조정됩니다. (비율 걱정 없이 업로드하세요)
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    캐러셀 피드 카드 <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(최대 10개)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCarouselFeedCard}
                    disabled={carouselFeedCards.length >= 10}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    + 카드 추가
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  카드 수: {carouselFeedCards.length}개
                </p>

                {carouselFeedCards.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      &quot;+ 카드 추가&quot; 버튼을 클릭하여 피드 카드를 추가하세요
                    </p>
                  </div>
                )}

                {carouselFeedCards.map((card, index) => (
                  <div key={card.id} className="border border-gray-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">카드 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCarouselFeedCard(card.id)}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* 카드 이미지 업로드 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          피드 이미지 <span className="text-red-500">*</span>
                        </label>
                        {!card.uploadedFile && (
                          <>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleCarouselFeedCardImageUpload(card.id, file);
                                }
                              }}
                              className="hidden"
                              id={`carousel-feed-image-${card.id}`}
                            />
                            <label
                              htmlFor={`carousel-feed-image-${card.id}`}
                              className="block w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer text-center"
                            >
                              <span className="text-sm text-gray-600">
                                {isUploading ? "업로드 중..." : "이미지 선택 (JPG, PNG)"}
                              </span>
                            </label>
                          </>
                        )}
                        {card.uploadedFile && (
                          <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                            <NextImage
                              src={card.uploadedFile.url}
                              alt={`카드 ${index + 1}`}
                              width={64}
                              height={64}
                              className="object-cover rounded"
                            />
                            <span className="text-xs text-gray-600 flex-1 truncate">
                              {card.uploadedFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCarouselFeedCardImage(card.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 클릭 URL */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          클릭 시 이동 URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={card.url_mobile}
                          onChange={(e) => handleCarouselFeedCardChange(card.id, 'url_mobile', e.target.value)}
                          placeholder="https://example.com/feed"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* 카드 제목 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => handleCarouselFeedCardChange(card.id, 'title', e.target.value)}
                          placeholder="카카오 프렌즈 기획전"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* 설명 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          설명 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={card.description}
                          onChange={(e) => handleCarouselFeedCardChange(card.id, 'description', e.target.value)}
                          placeholder="무더위? 귀여움으로 쿨하게 극복! 클링 소재로 쿨하게 살아남기🌊"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>

                      {/* 버튼 입력 (1-2개) */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          버튼 <span className="text-red-500">*</span>
                          <span className="text-gray-500 ml-1">(최소 1개, 최대 2개)</span>
                        </label>
                        {card.buttons.map((button, btnIndex) => (
                          <div key={btnIndex} className="border border-gray-200 rounded-lg p-3 mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">버튼 {btnIndex + 1}</span>
                              {card.buttons.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedCards = carouselFeedCards.map(c =>
                                      c.id === card.id
                                        ? { ...c, buttons: c.buttons.filter((_, i) => i !== btnIndex) }
                                        : c
                                    );
                                    setCarouselFeedCards(updatedCards);
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">버튼명</label>
                                <input
                                  type="text"
                                  value={button.name}
                                  onChange={(e) => {
                                    const updatedCards = carouselFeedCards.map(c =>
                                      c.id === card.id
                                        ? {
                                            ...c,
                                            buttons: c.buttons.map((btn, i) =>
                                              i === btnIndex ? { ...btn, name: e.target.value } : btn
                                            )
                                          }
                                        : c
                                    );
                                    setCarouselFeedCards(updatedCards);
                                  }}
                                  placeholder="자세히 보기"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">링크 타입</label>
                                <select
                                  value={button.type}
                                  onChange={(e) => {
                                    const updatedCards = carouselFeedCards.map(c =>
                                      c.id === card.id
                                        ? {
                                            ...c,
                                            buttons: c.buttons.map((btn, i) =>
                                              i === btnIndex ? { ...btn, type: e.target.value } : btn
                                            )
                                          }
                                        : c
                                    );
                                    setCarouselFeedCards(updatedCards);
                                  }}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                >
                                  <option value="WL">웹링크 (WL)</option>
                                  <option value="AL">앱링크 (AL)</option>
                                  <option value="BK">봇키워드 (BK)</option>
                                  <option value="MD">메시지전달 (MD)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">모바일 URL</label>
                                <input
                                  type="url"
                                  value={button.url_mobile || ''}
                                  onChange={(e) => {
                                    const updatedCards = carouselFeedCards.map(c =>
                                      c.id === card.id
                                        ? {
                                            ...c,
                                            buttons: c.buttons.map((btn, i) =>
                                              i === btnIndex ? { ...btn, url_mobile: e.target.value } : btn
                                            )
                                          }
                                        : c
                                    );
                                    setCarouselFeedCards(updatedCards);
                                  }}
                                  placeholder="https://example.com"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">PC URL (선택)</label>
                                <input
                                  type="url"
                                  value={button.url_pc || ''}
                                  onChange={(e) => {
                                    const updatedCards = carouselFeedCards.map(c =>
                                      c.id === card.id
                                        ? {
                                            ...c,
                                            buttons: c.buttons.map((btn, i) =>
                                              i === btnIndex ? { ...btn, url_pc: e.target.value } : btn
                                            )
                                          }
                                        : c
                                    );
                                    setCarouselFeedCards(updatedCards);
                                  }}
                                  placeholder="https://example.com"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {card.buttons.length < 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedCards = carouselFeedCards.map(c =>
                                c.id === card.id
                                  ? {
                                      ...c,
                                      buttons: [
                                        ...c.buttons,
                                        { name: "버튼 " + (c.buttons.length + 1), type: "WL", url_mobile: "" }
                                      ]
                                    }
                                  : c
                              );
                              setCarouselFeedCards(updatedCards);
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs text-gray-600"
                          >
                            + 버튼 추가
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 버튼 추가 (선택) */}
          {maxButtons[chatBubbleType] > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                버튼 추가 (선택, 최대 {maxButtons[chatBubbleType]}개)
              </label>

              {/* 버튼 목록 */}
              {buttons.map((button, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">버튼 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteButton(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* 버튼명 */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        버튼명 <span className="text-red-500">*</span> (최대 14자)
                      </label>
                      <input
                        type="text"
                        value={button.name}
                        onChange={(e) => handleButtonChange(index, "name", e.target.value)}
                        placeholder="예: 자세히 보기"
                        maxLength={14}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* 모바일 URL */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        모바일 URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={button.url_mobile}
                        onChange={(e) => handleButtonChange(index, "url_mobile", e.target.value)}
                        placeholder="https://m.example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* PC URL */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        PC URL (선택)
                      </label>
                      <input
                        type="url"
                        value={button.url_pc || ""}
                        onChange={(e) => handleButtonChange(index, "url_pc", e.target.value)}
                        placeholder="https://www.example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* 버튼 추가 버튼 */}
              {buttons.length < maxButtons[chatBubbleType] && (
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                >
                  + 버튼 추가
                </button>
              )}
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              ℹ️ 템플릿 등록 안내
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 템플릿 등록 후 MTS 관리자 승인이 필요합니다.</li>
              <li>• 승인 후 메시지 발송이 가능합니다.</li>
              <li>• 변수는 발송 시 자동으로 치환됩니다.</li>
              <li>• 브랜드 메시지 단가: 20원/건</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: "#795548" }}
            >
              {isSubmitting ? "등록 중..." : "템플릿 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandTemplateModal;
