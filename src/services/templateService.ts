import { Template, DynamicButton } from "@/types/targetMarketing";

export interface SaveTemplateRequest {
  name: string;
  content: string;
  image_url?: string | null;
  category: string;
  is_private: boolean;
  buttons?: DynamicButton[];
}

export interface SaveTemplateResponse {
  id: string;
  message: string;
}

export interface GetTemplatesResponse {
  templates: Template[];
}

/**
 * 템플릿 저장 API 호출
 */
export const saveTemplate = async (
  request: SaveTemplateRequest,
  token: string
): Promise<SaveTemplateResponse> => {
  const response = await fetch("/api/templates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: request.name.trim(),
      content: request.content.trim(),
      image_url: request.image_url || null,
      category: request.category,
      is_private: request.is_private,
      buttons: request.buttons || [],
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 403) {
      throw new Error("템플릿 저장 권한이 없습니다.");
    }
    throw new Error(`템플릿 저장에 실패했습니다. (${response.status})`);
  }

  const data = await response.json();
  return {
    id: data.id,
    message: data.message || "템플릿이 성공적으로 저장되었습니다!",
  };
};

/**
 * 템플릿 목록 조회 API 호출
 */
export const getTemplates = async (token: string): Promise<GetTemplatesResponse> => {
  const response = await fetch("/api/templates", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    throw new Error(`템플릿을 불러오는데 실패했습니다. (${response.status})`);
  }

  const data = await response.json();
  return {
    templates: data.templates || [],
  };
};

/**
 * 특정 템플릿 조회 API 호출
 */
export const getTemplate = async (
  templateId: string,
  token: string
): Promise<Template> => {
  const response = await fetch(`/api/templates/${templateId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 404) {
      throw new Error("템플릿을 찾을 수 없습니다.");
    }
    throw new Error(`템플릿을 불러오는데 실패했습니다. (${response.status})`);
  }

  const data = await response.json();
  return data.template;
};

/**
 * 템플릿 삭제 API 호출
 */
export const deleteTemplate = async (
  templateId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`/api/templates/${templateId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 403) {
      throw new Error("템플릿 삭제 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error("템플릿을 찾을 수 없습니다.");
    }
    throw new Error(`템플릿 삭제에 실패했습니다. (${response.status})`);
  }
};

/**
 * 템플릿 업데이트 API 호출
 */
export const updateTemplate = async (
  templateId: string,
  request: Partial<SaveTemplateRequest>,
  token: string
): Promise<Template> => {
  const response = await fetch(`/api/templates/${templateId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 403) {
      throw new Error("템플릿 수정 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error("템플릿을 찾을 수 없습니다.");
    }
    throw new Error(`템플릿 수정에 실패했습니다. (${response.status})`);
  }

  const data = await response.json();
  return data.template;
};
