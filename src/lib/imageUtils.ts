// 이미지 해상도 확인 및 리사이징 유틸리티

export interface ImageDimensions {
  width: number;
  height: number;
}

// 이미지 파일에서 해상도 추출
export function getImageDimensionsFromFile(
  file: File
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 로드할 수 없습니다."));
    };

    img.src = url;
  });
}

// 이미지 리사이징 (최대 해상도 제한)
export function resizeImage(
  file: File,
  maxWidth: number = 1500,
  maxHeight: number = 1440,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const url = URL.createObjectURL(file);

    if (!ctx) {
      reject(new Error("Canvas context를 생성할 수 없습니다."));
      return;
    }

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width: originalWidth, height: originalHeight } = img;

      // 비율 계산
      const ratio = Math.min(
        maxWidth / originalWidth,
        maxHeight / originalHeight
      );

      // 새로운 크기 계산
      const newWidth = Math.round(originalWidth * ratio);
      const newHeight = Math.round(originalHeight * ratio);

      // Canvas 크기 설정
      canvas.width = newWidth;
      canvas.height = newHeight;

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("이미지 변환에 실패했습니다."));
            return;
          }

          // File 객체 생성
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 로드할 수 없습니다."));
    };

    img.src = url;
  });
}

// 해상도 초과 여부 확인
export function isResolutionExceeded(
  dimensions: ImageDimensions,
  maxWidth: number = 1500,
  maxHeight: number = 1440
): boolean {
  return dimensions.width > maxWidth || dimensions.height > maxHeight;
}

// 파일 크기가 제한을 초과하는지 확인
export function isFileSizeExceeded(
  file: File,
  maxSizeKB: number = 300
): boolean {
  return file.size > maxSizeKB * 1024;
}
