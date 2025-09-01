import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, previousMessages, initialImage } = await request.json();


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
      content: [
        {
          type: msg.role === "user" ? "input_text" : "output_text",
          text: msg.content,
        },
      ],
    }));

    // 첫 대화 확인 로직 제거됨 - 프론트엔드에서 처리

    // 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 사용자 입력 컨텐츠 구성
          const userContent = [];

          // 기존 방식으로 콘텐츠 생성
          const promptText = `마케팅 전문가로서 답변해주세요. 사용자가 이전에 제공한 정보를 바탕으로 맞춤형 마케팅 콘텐츠를 생성해주세요.
            
            마케팅 이미지를 생성해주세요. 이미지는 텍스트를 포함하지 마세요.
            프롬프트와 관계 없이 항상 이미지는 하나만 생성해주세요.
            
            SMS/MMS 메시지 작성 시 다음 원칙을 따라주세요:
            - 혜택과 목적을 명확히 전달
            - 중요한 문구를 앞에 배치
            - 최대 2줄로 제한된 간결한 메시지
            - 90자 이내로 작성
            
            quick_action_buttons 버튼 텍스트는 최대 4개까지 포함해주세요.
            
            응답은 다음 JSON 형식으로 포함해주세요. 반드시 유효한 JSON만 출력하고, 설명 텍스트는 출력하지 마세요.
            - concise_title: 내용을 직관적이고 간단하게 요약(두괄식). 20자 이내를 권장.
            - sms_text_content: 제목에 들어간 핵심 단어/구를 반복하지 않되, 의미가 빈약해지지 않도록 보완 설명 위주로 구성. 최대 2줄·90자 이내 유지.
            - structured_recommendation: response 본문에서 핵심 권장사항을 항목별(섹션/아이템)로 요약한 표 데이터. 번호가 있는 항목(예: "1) 동선 단축: ...")은 섹션명, 콜론 뒤는 bullet로 분해. 번호가 없어도 "톤앤매너:" 등 의미 있는 키워드는 섹션으로 사용.
            
            {
              "concise_title": "두괄식 요약 제목",
              "response": "마케팅 조언 및 설명",
              "sms_text_content": "SMS/MMS 전송용 간결한 메시지 (90자 이내, 2줄 제한)",
              "quick_action_buttons": [
                {
                  "text": "버튼 텍스트"
                }
              ],
              "structured_recommendation": [
                { "section": "동선 단축", "items": ["랜딩 상단에 리뷰 플랫폼 바로가기 버튼"] },
                { "section": "사회적 증거", "items": ["최근 베스트 리뷰 2~3개", "평점 시각화"] },
                { "section": "타이밍", "items": ["구매/방문 1~3시간 내 자동 발송"] },
                { "section": "장벽 제거", "items": ["로그인/회원가입 없이 작성 가능한 링크"] },
                { "section": "동기 강화", "items": ["‘리뷰로 더 나은 서비스’ 가치 제안", "우수 리뷰 소개(사전 동의)"] },
                { "section": "채널 믹스", "items": ["영수증·QR·카톡 동시 운영"] },
                { "section": "톤앤매너", "items": ["따뜻·정중", "요청은 짧고 명확하게"] }
              ]
            }
            
            ${
              initialImage ? "첨부된 이미지를 참고하여 " : ""
            }사용자 요청: ${message}`;
          
          userContent.push({
            type: "input_text",
            text: promptText,
          });

          // 초기 이미지가 있으면 추가 - 올바른 형식으로 수정
          if (initialImage) {
            // base64 데이터에서 data URL 접두사 제거
            const base64Data = initialImage.replace(
              /^data:image\/[^;]+;base64,/,
              ""
            );

            userContent.push({
              type: "input_image",
              image_url: `data:image/png;base64,${base64Data}`,
            });
          }

          // OpenAI 스트리밍 응답 생성
          const responseConfig = {
            model: "gpt-5" as const,
            input: [
              ...conversationHistory,
              {
                role: "user",
                content: userContent,
              },
            ],
            reasoning: { effort: "low" as const },
            stream: true as const,
            tools: [] as Array<{ type: "image_generation"; partial_images: number; quality: string; size: string }>,
          };
          
          // 이미지 생성 도구 추가
          responseConfig.tools = [
            {
              type: "image_generation",
              partial_images: 3,
              quality: "high",
              size: "1024x1024",
            },
          ];
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response = await client.responses.create(responseConfig as any);

          let fullText = "";
          let imageUrl = null;
          let templateData = null;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
          let partialImages: string[] = [];
          let smsTextContent = "";
          let displayText = "";
          let quickActionButtons: Array<{text: string}> = [];
          let isJsonParsed = false;
          let isControllerClosed = false;
          let isQuestion = false;
          let structuredRecommendation: Array<{ section: string; items: string[] }> | null = null;
          let conciseTitle: string | null = null;

          // 컨트롤러 상태 확인 함수
          const safeEnqueue = (data: string) => {
            if (isControllerClosed) {
              return; // 이미 닫혔으면 무시
            }
            try {
              controller.enqueue(new TextEncoder().encode(data));
            } catch (error) {
              console.error("Stream controller error:", error);
              isControllerClosed = true; // 오류 발생 시 닫힌 상태로 표시
            }
          };

          // 컨트롤러 안전 닫기 함수
          const safeClose = () => {
            if (!isControllerClosed) {
              try {
                safeClose();
                isControllerClosed = true;
              } catch (error) {
                console.error("Controller close error:", error);
                isControllerClosed = true;
              }
            }
          };

          // 스트림 이벤트 처리
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for await (const event of response as any) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eventAny = event as any;

            if (eventAny.type === "response.output_text.delta") {
              const textDelta = eventAny.delta;
              fullText += textDelta;

              // JSON 파싱 시도
              try {
                const jsonMatch = fullText.match(
                  /\{[\s\S]*"response"[\s\S]*\}/
                );
                if (jsonMatch && !isJsonParsed) {
                  const jsonResponse = JSON.parse(jsonMatch[0]);
                  if (jsonResponse.response) {
                    // JSON이 완성되면 response 부분만 표시
                    displayText = jsonResponse.response;
                    smsTextContent = jsonResponse.sms_text_content || "";
                    quickActionButtons = jsonResponse.quick_action_buttons || [];
                    isQuestion = jsonResponse.is_question || false;
                    structuredRecommendation = jsonResponse.structured_recommendation || null;
                    conciseTitle = (jsonResponse.concise_title || "").toString();
                    isJsonParsed = true;

                    // 기존 텍스트를 지우고 새로운 텍스트로 교체
                    const data = JSON.stringify({
                      type: "text_replace",
                      content: displayText,
                      smsTextContent: smsTextContent,
                      quickActionButtons: quickActionButtons,
                      isQuestion: isQuestion,
                      conciseTitle: conciseTitle,
                      structuredRecommendation: structuredRecommendation,
                    });
                    safeEnqueue(`data: ${data}\n\n`);
                  }
                } else if (!isJsonParsed) {
                  // JSON이 아직 완성되지 않았으면 델타 전송하지 않음
                  // 또는 JSON이 아닌 일반 텍스트면 그대로 전송
                  if (
                    !fullText.includes('"response"') &&
                    !fullText.includes('"sms_text_content"')
                  ) {
                    displayText += textDelta;
                    const data = JSON.stringify({
                      type: "text_delta",
                      content: textDelta,
                    });
                    safeEnqueue(`data: ${data}\n\n`);
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
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${data}\n\n`)
                  );
                }
              }
            } else if (
              eventAny.type === "response.image_generation_call.partial_image"
            ) {
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
              safeEnqueue(`data: ${data}\n\n`);
            } else if (
              eventAny.type === "response.image_generation_call.result" ||
              eventAny.type === "response.image_generation_call.completed"
            ) {
              // 최종 이미지 생성 완료
              const imageBase64 = eventAny.result || eventAny.image_b64;
              if (imageBase64) {
                imageUrl = `data:image/png;base64,${imageBase64}`;

                // 최종 이미지 URL 전송
                const data = JSON.stringify({
                  type: "image_generated",
                  imageUrl: imageUrl,
                });
                safeEnqueue(`data: ${data}\n\n`);
              }
            } else if (eventAny.type === "response.done") {
              // 이미지가 생성된 경우 최종 전솤
              if (imageUrl) {
                const data = JSON.stringify({
                  type: "image_generated",
                  imageUrl: imageUrl,
                });
                safeEnqueue(`data: ${data}\n\n`);
              }
              // 응답 완료 - 이미 파싱된 데이터 사용 또는 재파싱
              if (!isJsonParsed) {
                try {
                  // JSON 형식의 응답에서 모든 필드 추출
                  const jsonMatch = fullText.match(
                    /\{[\s\S]*"response"[\s\S]*\}/
                  );
                  if (jsonMatch) {
                    const jsonResponse = JSON.parse(jsonMatch[0]);
                    displayText = jsonResponse.response || fullText;
                    smsTextContent = jsonResponse.sms_text_content || "";
                    quickActionButtons = jsonResponse.quick_action_buttons || [];
                    isQuestion = jsonResponse.is_question || false;
                    structuredRecommendation = jsonResponse.structured_recommendation || null;
                    conciseTitle = (jsonResponse.concise_title || "").toString();
                  } else {
                    displayText = fullText;
                    smsTextContent = extractSMSContent(fullText);
                    quickActionButtons = [];
                  }
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                  displayText = fullText;
                  smsTextContent = extractSMSContent(fullText);
                  quickActionButtons = [];
                }
              }

              if (imageUrl) {
                templateData = {
                  title: extractTitle(message) || "AI 생성 마케팅 캠페인",
                  description:
                    extractDescription(displayText) ||
                    displayText.substring(0, 100) + "...",
                };
              }

              const data = JSON.stringify({
                type: "response_complete",
                fullText: displayText,
                imageUrl: imageUrl,
                templateData: templateData,
                smsTextContent: smsTextContent,
                quickActionButtons: quickActionButtons,
                isQuestion: isQuestion,
                conciseTitle: conciseTitle,
                structuredRecommendation: structuredRecommendation,
              });
              safeEnqueue(`data: ${data}\n\n`);
              break;
            }
          }

          safeClose();
        } catch (error) {
          console.error("스트리밍 오류:", error);
          
          let errorMessage = "스트리밍 중 오류가 발생했습니다.";
          
          if (error instanceof Error) {
            if (error.message.includes("exceeded your current quota")) {
              errorMessage = "AI 서비스 사용량이 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
            } else if (error.message.includes("insufficient_quota")) {
              errorMessage = "AI 서비스 사용량이 부족합니다. 관리자에게 문의해 주세요.";
            } else {
              errorMessage = error.message;
            }
          }
          
          const errorData = JSON.stringify({
            type: "error",
            error: errorMessage,
          });
          try {
            controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
            controller.close();
          } catch {
            // 컨트롤러가 이미 닫혔으면 무시
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("OpenAI API 오류:", error);

    if (error instanceof Error) {
      let errorMessage = `AI 서비스 오류: ${error.message}`;
      
      if (error.message.includes("exceeded your current quota")) {
        errorMessage = "AI 서비스 사용량이 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
      } else if (error.message.includes("insufficient_quota")) {
        errorMessage = "AI 서비스 사용량이 부족합니다. 관리자에게 문의해 주세요.";
      }
      
      return NextResponse.json(
        { error: errorMessage },
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
    카페: "카페 마케팅 캠페인",
    레스토랑: "레스토랑 프로모션",
    할인: "특별 할인 이벤트",
    신메뉴: "신메뉴 출시 이벤트",
    오픈: "그랜드 오픈 이벤트",
    세일: "시즌 세일 이벤트",
    이벤트: "특별 이벤트",
    프로모션: "프로모션 캠페인",
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
