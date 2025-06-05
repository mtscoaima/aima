import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, previousMessages } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "메시지가 필요합니다." },
        { status: 400 }
      );
    }

    // 대화 히스토리 구성
    const conversationHistory = previousMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // OpenAI가 필요에 따라 이미지 생성 도구를 자동으로 선택
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        ...conversationHistory,
        {
          role: "user",
          content: `마케팅 전문가로서 답변해주세요. 필요하다면 적절한 마케팅 이미지를 생성해주세요: ${message}`
        }
      ],
      tools: [{ type: "image_generation" }],
    });

    console.log(response);
    console.log(message);
    console.log(conversationHistory);

    // 이미지 생성 결과 확인
    const imageOutput = response.output.find(
      (output: any) => output.type === "image_generation_call"
    ) as any;

    let imageUrl = null;
    if (imageOutput && imageOutput.result) {
      // Base64 이미지를 데이터 URL로 변환
      imageUrl = `data:image/png;base64,${imageOutput.result}`;
    }

    // 텍스트 응답 추출 - Responses API는 output_text 필드를 사용
    const responseText = response.output_text || "응답을 생성했습니다.";

    // 이미지가 생성된 경우 템플릿 데이터 생성
    let templateData = null;
    if (imageUrl) {
      templateData = {
        title: extractTitle(message) || "AI 생성 마케팅 캠페인",
        description: extractDescription(responseText) || responseText.substring(0, 100) + "...",
      };
    }

    return NextResponse.json({
      message: responseText,
      imageUrl,
      templateData,
    });
  } catch (error) {
    console.error("OpenAI API 오류:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `AI 서비스 오류: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "AI 서비스에 연결할 수 없습니다." },
      { status: 500 }
    );
  }
}

// 제목 추출 함수
function extractTitle(message: string): string {
  const keywords = {
    "카페": "카페 마케팅 캠페인",
    "레스토랑": "레스토랑 프로모션",
    "할인": "특별 할인 이벤트",
    "신메뉴": "신메뉴 출시 이벤트",
    "오픈": "그랜드 오픈 이벤트",
    "세일": "시즌 세일 이벤트",
    "이벤트": "특별 이벤트",
    "프로모션": "프로모션 캠페인",
  };

  for (const [keyword, title] of Object.entries(keywords)) {
    if (message.includes(keyword)) {
      return title;
    }
  }

  return "AI 생성 마케팅 캠페인";
}

// 설명 추출 함수
function extractDescription(text: string): string {
  // 첫 번째 문장이나 적절한 길이로 자르기
  const sentences = text.split(/[.!?]/);
  if (sentences.length > 0 && sentences[0].length > 10) {
    return sentences[0].trim() + ".";
  }
  
  return text.length > 100 ? text.substring(0, 100) + "..." : text;
} 