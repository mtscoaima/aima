import { Message } from "@/types/targetMarketing";

export interface ChatRequest {
  message: string;
  previousMessages: Message[];
  initialImage?: string;
}

export interface ChatResponse {
  message: string;
  imageUrl?: string;
}

export interface EditImageRequest {
  baseImageUrl: string;
  editPrompt: string;
}

export interface EditImageResponse {
  imageUrl: string;
}

/**
 * AI 채팅 API 호출 (일반)
 */
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("API 요청에 실패했습니다.");
  }

  const data = await response.json();
  return {
    message: data.message,
    imageUrl: data.imageUrl,
  };
};

/**
 * AI 채팅 API 호출 (스트리밍)
 */
export const sendChatMessageStreaming = async (
  request: Omit<ChatRequest, 'previousMessages'> & { previousMessages: Message[] },
  onData: (chunk: string) => void,
  onComplete: (fullMessage: string, imageUrl?: string) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("스트리밍 요청에 실패했습니다.");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullMessage = "";
    let currentImageUrl: string | undefined;

    if (!reader) {
      throw new Error("응답을 읽을 수 없습니다.");
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.message) {
              const messageChunk = data.message;
              fullMessage += messageChunk;
              onData(messageChunk);
            }
            if (data.imageUrl) {
              currentImageUrl = data.imageUrl;
            }
          } catch (parseError) {
            // JSON 파싱 오류는 무시 (불완전한 chunk일 수 있음)
          }
        }
      }
    }

    onComplete(fullMessage, currentImageUrl);
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error occurred'));
  }
};

/**
 * 이미지 편집 API 호출
 */
export const editImage = async (request: EditImageRequest): Promise<EditImageResponse> => {
  const response = await fetch("/api/ai/edit-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "이미지 편집에 실패했습니다.");
  }

  const data = await response.json();
  return {
    imageUrl: data.imageUrl,
  };
};

/**
 * MMS 발송 API 호출 (AI를 통한 직접 발송)
 */
export const sendMMS = async (phoneNumber: string, message: string, imageUrl?: string): Promise<void> => {
  const response = await fetch("/api/ai/send-mms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
      message,
      imageUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "MMS 발송에 실패했습니다.");
  }
};
