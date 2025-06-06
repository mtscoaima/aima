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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversationHistory = previousMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // OpenAI 스트리밍 응답 생성
          const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: [
              ...conversationHistory,
              {
                role: "user",
                content: `마케팅 전문가로서 답변해주세요. 필요하다면 적절한 마케팅 이미지를 생성해주세요. 
                응답은 다음 JSON 형식으로 포함해주세요:
                {
                  "response": "마케팅 조언 및 설명",
                  "sms_text_content": "SMS/MMS 전송용 간결한 메시지 (90자 이내)"
                }
                
                사용자 요청: ${message}`
              }
            ],
            tools: [{ 
              type: "image_generation",
              partial_images: 3,
              quality: "low"
            }],
            stream: true,
          });

          let fullText = "";
          let imageUrl = null;
          let templateData = null;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
          let partialImages: string[] = [];
          let smsTextContent = "";
          let displayText = "";
          let isJsonParsed = false;

          // 스트림 이벤트 처리
          for await (const event of response) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eventAny = event as any;
            
            if (eventAny.type === "response.output_text.delta") {
              const textDelta = eventAny.delta;
              fullText += textDelta;
              
              // JSON 파싱 시도
              try {
                const jsonMatch = fullText.match(/\{[\s\S]*"response"[\s\S]*\}/);
                if (jsonMatch && !isJsonParsed) {
                  const jsonResponse = JSON.parse(jsonMatch[0]);
                  if (jsonResponse.response) {
                    // JSON이 완성되면 response 부분만 표시
                    displayText = jsonResponse.response;
                    smsTextContent = jsonResponse.sms_text_content || "";
                    isJsonParsed = true;
                    
                    // 기존 텍스트를 지우고 새로운 텍스트로 교체
                    const data = JSON.stringify({
                      type: "text_replace",
                      content: displayText,
                      smsTextContent: smsTextContent,
                    });
                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                  }
                } else if (!isJsonParsed) {
                  // JSON이 아직 완성되지 않았으면 델타 전송하지 않음
                  // 또는 JSON이 아닌 일반 텍스트면 그대로 전송
                  if (!fullText.includes('"response"') && !fullText.includes('"sms_text_content"')) {
                    displayText += textDelta;
                    const data = JSON.stringify({
                      type: "text_delta",
                      content: textDelta,
                    });
                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                  }
                }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                // JSON 파싱 실패 시 일반 텍스트로 처리
                if (!isJsonParsed && !fullText.includes('"response"')) {
                  displayText += textDelta;
                  const data = JSON.stringify({
                    type: "text_delta",
                    content: textDelta,
                  });
                  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                }
              }
            } else if (eventAny.type === "response.image_generation_call.partial_image") {
              // 부분 이미지 생성 중
              const partialImageBase64 = eventAny.partial_image_b64;
              const partialImageIndex = eventAny.partial_image_index;
              const partialImageUrl = `data:image/png;base64,${partialImageBase64}`;
              
              // 부분 이미지 전송
              const data = JSON.stringify({
                type: "partial_image",
                imageUrl: partialImageUrl,
                index: partialImageIndex,
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            } else if (eventAny.type === "response.image_generation_call.result") {
              // 최종 이미지 생성 완료
              imageUrl = `data:image/png;base64,${eventAny.result}`;
              
              // 최종 이미지 URL 전송
              const data = JSON.stringify({
                type: "image_generated",
                imageUrl: imageUrl,
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            } else if (eventAny.type === "response.done") {
              // 응답 완료 - 이미 파싱된 데이터 사용 또는 재파싱
              if (!isJsonParsed) {
                try {
                  // JSON 형식의 응답에서 sms_text_content 추출
                  const jsonMatch = fullText.match(/\{[\s\S]*"sms_text_content"[\s\S]*\}/);
                  if (jsonMatch) {
                    const jsonResponse = JSON.parse(jsonMatch[0]);
                    displayText = jsonResponse.response || fullText;
                    smsTextContent = jsonResponse.sms_text_content || "";
                  } else {
                    displayText = fullText;
                    smsTextContent = extractSMSContent(fullText);
                  }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                  console.log("JSON 파싱 실패, 전체 텍스트에서 SMS 내용 추출 시도");
                  displayText = fullText;
                  smsTextContent = extractSMSContent(fullText);
                }
              }

              if (imageUrl) {
                templateData = {
                  title: extractTitle(message) || "AI 생성 마케팅 캠페인",
                  description: extractDescription(displayText) || displayText.substring(0, 100) + "...",
                };
              }

              const data = JSON.stringify({
                type: "response_complete",
                fullText: displayText,
                imageUrl: imageUrl,
                templateData: templateData,
                smsTextContent: smsTextContent,
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
              break;
            }
          }

          controller.close();
        } catch (error) {
          console.error("스트리밍 오류:", error);
          const errorData = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "스트리밍 중 오류가 발생했습니다.",
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
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

// SMS 내용 추출 함수
function extractSMSContent(text: string): string {
  // 텍스트에서 SMS에 적합한 내용 추출 (90자 이내)
  const sentences = text.split(/[.!?]/);
  let smsContent = "";
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 10 && trimmed.length <= 90) {
      smsContent = trimmed;
      break;
    }
  }
  
  // 적절한 문장을 찾지 못한 경우 전체 텍스트를 90자로 자르기
  if (!smsContent) {
    smsContent = text.substring(0, 87) + "...";
  }
  
  return smsContent;
} 