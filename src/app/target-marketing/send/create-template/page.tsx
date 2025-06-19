"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { AdvertiserGuard } from "@/components/RoleGuard";
import "./styles.css";

// GPT API 키
const GPT_API_KEY =
  "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";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CampaignData {
  title: string;
  subtitle: string;
  body: string;
  additional: string;
  button1: string;
  button2: string;
  templateTitle?: string;
  imagePrompt?: string;
}

export default function TemplateCreatePage() {
  const [templateTitle, setTemplateTitle] = useState("");
  const [subTitleText, setSubTitleText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [additionalText, setAdditionalText] = useState("");
  const [button1Text, setButton1Text] = useState("버튼1");
  const [button2Text, setButton2Text] = useState("버튼2");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"basic" | "ai">("basic");
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [promptDescription, setPromptDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedTones, setSelectedTones] = useState<string[]>(["friendly"]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isUsingImageUrl, setIsUsingImageUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 채팅창 스크롤을 항상 최하단으로 유지
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result.toString());
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRemoveImage = () => {
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModeChange = (newMode: "basic" | "ai") => {
    setMode(newMode);

    // AI 모드로 전환할 때 이전에 생성된 템플릿 데이터를 프롬프트에 반영
    if (newMode === "ai") {
      // 채팅 기록이 있으면 채팅창 표시
      if (messages.length > 0) {
        setChatVisible(true);
      }

      // 기본형에서 입력된 데이터가 있고 프롬프트가 비어있는 경우 자동 입력
      if (
        (titleText || subTitleText || bodyText) &&
        !promptDescription.trim()
      ) {
        const currentData = [
          titleText && `타이틀: ${titleText}`,
          subTitleText && `서브 타이틀: ${subTitleText}`,
          bodyText && `본문: ${bodyText}`,
          additionalText && `부가 정보: ${additionalText}`,
          button1Text !== "버튼1" && `버튼1: ${button1Text}`,
          button2Text !== "버튼2" && `버튼2: ${button2Text}`,
        ]
          .filter(Boolean)
          .join("\n");

        if (currentData) {
          setPromptDescription(
            `현재 작성 중인 템플릿 내용을 바탕으로 개선해주세요:\n${currentData}`
          );
        }
      }
    }
  };

  const startChat = async () => {
    setChatVisible(true);
    setIsLoading(true);

    // 이미 초기 메시지가 있는 경우 추가하지 않음
    if (messages.length === 0) {
      // 초기 시스템 메시지 추가
      const initialMessage: Message = {
        role: "assistant",
        content:
          "안녕하세요! 마케팅 템플릿 생성을 도와드리겠습니다. 어떤 템플릿을 만들고 싶으신가요?",
      };

      setMessages([initialMessage]);
    }

    // 초기 정보를 바탕으로 AI에 첫 요청 보내기
    if (promptDescription && messages.length <= 1) {
      const userFirstMessage: Message = {
        role: "user",
        content: `다음 내용으로 마케팅 템플릿을 만들어주세요:
        - 내용: ${promptDescription}
        - 타겟 고객: ${targetAudience || "모든 고객"}
        - 톤앤매너: ${selectedTones.join(", ")}`,
      };

      setMessages((prev) => [...prev, userFirstMessage]);

      try {
        const response = await fetchGptResponse(userFirstMessage.content);

        // AI 응답 메시지 추가
        const assistantMessage: Message = {
          role: "assistant",
          content: response.text,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // 응답에서 템플릿 데이터 추출해서 폼에 적용
        if (response.campaignData) {
          applyAiCampaignData(response.campaignData);
        }
      } catch (error) {
        console.error("AI 응답 오류:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "죄송합니다. 요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
          },
        ]);
      }
    }

    setIsLoading(false);
  };

  const applyAiCampaignData = (data: CampaignData) => {
    console.log("캠페인 데이터 적용 시작:", data);
    try {
      if (data.title) setTitleText(data.title);
      if (data.subtitle) setSubTitleText(data.subtitle);
      if (data.body) setBodyText(data.body);
      if (data.additional) setAdditionalText(data.additional);
      if (data.button1) setButton1Text(data.button1);
      if (data.button2) setButton2Text(data.button2);
      if (data.templateTitle) setTemplateTitle(data.templateTitle);
      if (data.imagePrompt) setImagePrompt(data.imagePrompt);

      console.log("캠페인 데이터 적용 완료");
    } catch (error) {
      console.error("캠페인 데이터 적용 중 오류 발생:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 사용자 메시지 추가
    const userMessage: Message = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetchGptResponse(inputMessage);

      // AI 응답 메시지 추가
      const assistantMessage: Message = {
        role: "assistant",
        content: response.text,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 응답에서 템플릿 데이터 추출해서 폼에 적용
      if (response.campaignData) {
        applyAiCampaignData(response.campaignData);
      }
    } catch (error) {
      console.error("AI 응답 오류:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "죄송합니다. 요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        },
      ]);
    }

    setIsLoading(false);
  };

  const fetchGptResponse = async (message: string) => {
    // 모든 채팅 내역을 포함하는 프롬프트 생성
    const chatHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 시스템 메시지 추가
    const systemMessage = {
      role: "system",
      content: `당신은 마케팅 템플릿 생성 전문가입니다. 사용자가 제공하는 정보를 바탕으로 효과적인 마케팅 템플릿을 만들어주세요.
      응답은 항상 두 파트로 구성해주세요:
      1. 사용자에게 보여줄, 마케팅 템플릿에 대한 설명과 제안을 담은 친절한 대화형 응답
      2. 템플릿에 사용될 정확한 JSON 형식의 데이터
      
      JSON 데이터는 반드시 다음 형식으로 제공해주세요:
      ===CAMPAIGN_DATA===
      {
        "templateTitle": "템플릿 이름",
        "title": "템플릿 제목",
        "subtitle": "서브 타이틀",
        "body": "본문 내용",
        "additional": "부가 정보",
        "button1": "버튼1 텍스트",
        "button2": "버튼2 텍스트",
        "imagePrompt": "이미지 생성을 위한 상세한 설명 (영어로 작성)"
      }
      ===END_DATA===
      
      중요: JSON 데이터는 반드시 위와 같은 정확한 형식으로, 별도의 설명 없이 제공해야 합니다.
      JSON 데이터에 맞지 않는 텍스트를 JSON 블록 내에 포함시키지 마세요.
      
      imagePrompt는 DALL-E에 전달할 영어로 된 이미지 생성 프롬프트입니다. 템플릿 내용과 일치하는 적절한 이미지를 생성할 수 있도록 상세하게 작성해주세요.
      
      사용자가 특정 부분만 수정을 요청하면 해당 부분만 변경하고, 나머지는 유지해주세요.`,
    };

    // API 요청 준비
    const requestBody = {
      model: "gpt-4o",
      messages: [
        systemMessage,
        ...chatHistory,
        { role: "user", content: message },
      ],
    };

    // 실제 API 연동
    try {
      console.log("GPT API 요청 전송:", requestBody);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GPT_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API 응답 에러:", errorData);
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log("GPT API 응답:", data);

      const responseText = data.choices[0].message.content;

      // 응답에서 템플릿 데이터 추출
      let campaignData = null;
      // 정규 표현식 수정: 더 유연하게 JSON 데이터 추출
      const dataMatch =
        responseText.match(
          /===CAMPAIGN_DATA===\s*([\s\S]*?)\s*===END_DATA===/
        ) || responseText.match(/CAMPAIGN_DATA[=\s]*[\s\S]*?[=\s]*END_DATA/);

      if (dataMatch && dataMatch[1]) {
        try {
          // JSON 문자열 정리: 앞뒤 공백 제거 및 유효한 JSON 형식인지 확인
          const jsonStr = dataMatch[1].trim();
          campaignData = JSON.parse(jsonStr);
          console.log("추출된 캠페인 데이터:", campaignData);

          // 응답 텍스트에서 JSON 부분 제거
          const cleanedText = responseText
            .replace(/===CAMPAIGN_DATA===[\s\S]*?===END_DATA===/g, "")
            .replace(/CAMPAIGN_DATA[=\s]*[\s\S]*?[=\s]*END_DATA/g, "")
            .trim();

          return { text: cleanedText, campaignData };
        } catch (e) {
          console.error("JSON 파싱 오류:", e, "원본 텍스트:", dataMatch[1]);
        }
      }

      // JSON 데이터를 찾지 못하거나 파싱 실패 시 원본 텍스트만 반환
      return { text: responseText };
    } catch (error) {
      console.error("API 요청 오류:", error);
      throw error;
    }
  };

  // DALL-E를 사용하여 이미지 생성
  const generateImage = async () => {
    if (!imagePrompt) {
      alert(
        "이미지 생성을 위한 프롬프트가 필요합니다. AI 템플릿을 먼저 생성해주세요."
      );
      return;
    }

    setIsGeneratingImage(true);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GPT_API_KEY}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        // 이미지 URL을 직접 사용
        const imageUrl = data.data[0].url;

        // URL을 직접 미리보기에 설정
        setImagePreview(imageUrl);
        setIsUsingImageUrl(true);

        // 성공 메시지 추가
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "이미지가 성공적으로 생성되었습니다! 템플릿 미리보기에서 확인해보세요.",
          },
        ]);
      }
    } catch (error) {
      console.error("이미지 생성 오류:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "죄송합니다. 이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        },
      ]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 이미지 저장 준비 함수
  const handleSave = async () => {
    // 이미지 URL을 사용 중인 경우, 백엔드로 URL 전송
    // 실제 구현은 백엔드 API에 따라 달라질 수 있음
    if (isUsingImageUrl && imagePreview) {
      // 예시: 백엔드에 데이터 전송
      const templateData = {
        templateTitle,
        title: titleText,
        subtitle: subTitleText,
        body: bodyText,
        additional: additionalText,
        button1: button1Text,
        button2: button2Text,
        imageUrl: imagePreview, // URL만 전송
      };

      console.log("저장할 템플릿 데이터:", templateData);
      // 여기에 실제 API 호출 코드 추가
      alert("템플릿이 저장되었습니다.");
    } else if (image) {
      // 직접 업로드한 이미지가 있는 경우
      const templateData = {
        templateTitle,
        title: titleText,
        subtitle: subTitleText,
        body: bodyText,
        additional: additionalText,
        button1: button1Text,
        button2: button2Text,
        // 이미지는 별도 처리 필요
      };

      console.log("저장할 템플릿 데이터:", templateData);
      // 여기에 실제 API 호출 코드 추가
      alert("템플릿이 저장되었습니다.");
    } else {
      // 이미지 없는 경우
      const templateData = {
        templateTitle,
        title: titleText,
        subtitle: subTitleText,
        body: bodyText,
        additional: additionalText,
        button1: button1Text,
        button2: button2Text,
      };

      console.log("저장할 템플릿 데이터:", templateData);
      // 여기에 실제 API 호출 코드 추가
      alert("템플릿이 저장되었습니다.");
    }
  };

  const handleToneSelection = (tone: string) => {
    setSelectedTones((prev) => {
      // 이미 선택된 경우 제거
      if (prev.includes(tone)) {
        return prev.filter((t) => t !== tone);
      }

      // 선택되지 않은 경우 추가 (최대 2개까지)
      if (prev.length < 2) {
        return [...prev, tone];
      }

      // 이미 2개 선택된 경우 첫 번째 항목 제거하고 새 항목 추가
      return [prev[1], tone];
    });
  };

  return (
    <AdvertiserGuard>
      <div className="template-page-container">
        <div className="template-page-header">
          <h1>템플릿 제작</h1>
          <p>효과적인 마케팅 템플릿을 쉽게 제작하고 관리하세요</p>
        </div>

        <div className="template-content">
          <div className="template-editor">
            <div className="editor-modes">
              <button
                className={`mode-btn ${mode === "basic" ? "active" : ""}`}
                onClick={() => handleModeChange("basic")}
              >
                <span className="mode-icon">📝</span>
                기본형
              </button>
              <button
                className={`mode-btn ${mode === "ai" ? "active" : ""}`}
                onClick={() => handleModeChange("ai")}
              >
                <span className="mode-icon">🤖</span>
                AI 도우미
              </button>
            </div>

            {mode === "basic" ? (
              <div className="editor-section">
                <h2>템플릿 만들기</h2>

                <div className="input-group">
                  <label>템플릿 이름</label>
                  <input
                    type="text"
                    placeholder="템플릿 이름을 입력하세요."
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    maxLength={50}
                  />
                  <div className="char-count">{templateTitle.length}/50자</div>
                </div>

                <div className="input-group">
                  <label>이미지</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      style={{ display: "none" }}
                    />
                    <div
                      className={`image-upload-box ${
                        imagePreview ? "has-image" : ""
                      }`}
                      onClick={handleImageClick}
                    >
                      {imagePreview && (
                        <div className="preview-container">
                          {isUsingImageUrl ? (
                            // 외부 URL인 경우 eslint-disable 사용
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imagePreview}
                              alt="업로드 이미지"
                              className="upload-preview"
                              style={{
                                width: "100%",
                                maxHeight: "200px",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            // 로컬 이미지인 경우 Next.js Image 컴포넌트 사용
                            <Image
                              src={imagePreview}
                              alt="업로드 이미지"
                              width={300}
                              height={200}
                              className="upload-preview"
                              style={{ objectFit: "contain" }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setImagePreview("")}
                            className="remove-image-btn"
                          >
                            이미지 제거
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label>서브 타이틀</label>
                  <input
                    type="text"
                    placeholder="서브 타이틀을 입력해주세요."
                    value={subTitleText}
                    onChange={(e) => setSubTitleText(e.target.value)}
                    maxLength={30}
                  />
                  <div className="char-count">{subTitleText.length}/30자</div>
                </div>

                <div className="input-group">
                  <label>타이틀</label>
                  <textarea
                    placeholder="타이틀을 입력해주세요."
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    maxLength={15}
                  />
                  <div className="char-count">{titleText.length}/15자</div>
                </div>

                <div className="input-group">
                  <label>본문 내용을 입력해주세요.</label>
                  <textarea
                    placeholder="본문 내용을 입력해주세요."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    maxLength={200}
                    className="body-textarea"
                  />
                  <div className="char-count">{bodyText.length}/200자</div>
                </div>

                <div className="input-group">
                  <label>부가 정보 내용</label>
                  <textarea
                    placeholder="부가 정보 내용을 입력해주세요."
                    value={additionalText}
                    onChange={(e) => setAdditionalText(e.target.value)}
                    maxLength={200}
                  />
                  <div className="char-count">
                    {additionalText.length}/200자
                  </div>
                </div>

                <div className="button-inputs">
                  <div className="input-group">
                    <label>버튼1</label>
                    <input
                      type="text"
                      placeholder="링크 주소를 입력해주세요."
                      value={button1Text}
                      onChange={(e) => setButton1Text(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label>버튼2</label>
                    <input
                      type="text"
                      placeholder="링크 주소를 입력해주세요."
                      value={button2Text}
                      onChange={(e) => setButton2Text(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {!chatVisible ? (
                  <div className="editor-section">
                    <h2>AI 도우미</h2>

                    <div className="ai-helper-container">
                      <div className="input-group">
                        <label>무엇을 홍보하고 싶으신가요?</label>
                        <textarea
                          placeholder="홍보하고자 하는 상품, 서비스, 이벤트 등에 대해 설명해주세요. AI가 자동으로 템플릿을 만들어 드립니다."
                          className="ai-input-textarea"
                          value={promptDescription}
                          onChange={(e) => setPromptDescription(e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label>타겟 고객</label>
                        <input
                          type="text"
                          placeholder="타겟 고객층을 입력해주세요. (예: 20-30대 여성, 자녀가 있는 부모 등)"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label>템플릿 톤앤매너 (최대 2개 선택)</label>
                        <div className="tone-tags">
                          {[
                            { value: "friendly", label: "친근한" },
                            { value: "professional", label: "전문적인" },
                            { value: "casual", label: "캐주얼한" },
                            { value: "formal", label: "격식있는" },
                            { value: "funny", label: "유머러스한" },
                            { value: "luxury", label: "고급스러운" },
                            { value: "simple", label: "심플한" },
                            { value: "creative", label: "창의적인" },
                            { value: "elegant", label: "우아한" },
                            { value: "bold", label: "대담한" },
                          ].map((tone) => (
                            <button
                              key={tone.value}
                              type="button"
                              className={`tone-tag ${
                                selectedTones.includes(tone.value)
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => handleToneSelection(tone.value)}
                            >
                              {tone.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        className="generate-btn"
                        onClick={startChat}
                        disabled={!promptDescription.trim()}
                      >
                        <span className="ai-icon">🤖</span>
                        AI로 템플릿 생성하기
                      </button>

                      <div className="ai-tips">
                        <h3>💡 AI 도우미 사용 팁</h3>
                        <ul>
                          <li>
                            구체적인 설명을 제공할수록 더 좋은 결과를 얻을 수
                            있습니다.
                          </li>
                          <li>
                            특별한 프로모션이나 할인 정보를 포함하면 전환율이
                            높아집니다.
                          </li>
                          <li>생성된 결과는 언제든지 수정할 수 있습니다.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="chat-container">
                    <div className="chat-header">
                      <h2>AI 도우미와 대화</h2>
                      <button
                        className="close-chat-btn"
                        onClick={() => setChatVisible(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="chat-messages" ref={chatContainerRef}>
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`chat-message ${
                            message.role === "user"
                              ? "user-message"
                              : "assistant-message"
                          }`}
                        >
                          <div className="message-avatar">
                            {message.role === "user" ? "👤" : "🤖"}
                          </div>
                          <div className="message-content">
                            {message.content}
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="chat-message assistant-message">
                          <div className="message-avatar">🤖</div>
                          <div className="message-content typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="chat-actions">
                      {imagePrompt && (
                        <button
                          className="generate-image-btn"
                          onClick={generateImage}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage
                            ? "이미지 생성중..."
                            : "🖼️ AI 이미지 생성하기"}
                        </button>
                      )}
                    </div>

                    <div className="chat-input-container">
                      <input
                        type="text"
                        className="chat-input"
                        placeholder="메시지를 입력하세요..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        disabled={isLoading}
                      />
                      <button
                        className="send-btn"
                        onClick={sendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                      >
                        <span className="send-icon">➤</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="submit-section">
              <button className="cancel-btn">취소</button>
              <button className="save-btn" onClick={handleSave}>
                저장
              </button>
            </div>
          </div>

          <div className="template-preview">
            <div className="preview-header">
              <h3>미리보기</h3>
            </div>

            <div className="mobile-preview">
              <div className="mobile-frame">
                <div className="mobile-header">
                  <div className="status-bar"></div>
                </div>

                <div className="message-content">
                  <div className="message-bubble">
                    {imagePreview && (
                      <div className="message-image-container">
                        {isUsingImageUrl ? (
                          // 외부 URL인 경우 eslint-disable 사용
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreview}
                            alt="템플릿 이미지"
                            className="message-image"
                            style={{
                              width: "100%",
                              maxHeight: "200px",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          // 로컬 이미지인 경우 Next.js Image 컴포넌트 사용
                          <Image
                            src={imagePreview}
                            alt="템플릿 이미지"
                            width={300}
                            height={200}
                            className="message-image"
                            style={{ objectFit: "contain" }}
                          />
                        )}
                      </div>
                    )}

                    <div className="message-subtitle">
                      {subTitleText || "서브 타이틀을 입력해주세요."}
                    </div>

                    <div className="message-title">
                      {titleText || "타이틀을 입력해주세요."}
                    </div>

                    <div className="message-body">
                      {bodyText || "본문 내용을 입력해주세요."}
                    </div>

                    <div className="message-additional">
                      {additionalText || "부가 정보 내용을 입력해주세요."}
                    </div>
                  </div>

                  <div className="message-buttons">
                    <button className="preview-button">{button1Text}</button>
                    <button className="preview-button">{button2Text}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdvertiserGuard>
  );
}
