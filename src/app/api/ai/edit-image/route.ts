import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, editType = "edit" } = await request.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "이미지 URL과 프롬프트가 필요합니다." },
        { status: 400 }
      );
    }

    let result;

    if (editType === "edit") {
      console.log("🎨 GPT-4 Vision + DALL-E 3 편집 모드 시작");

      try {
        // 1단계: 현재 이미지를 Base64로 변환
        const base64Image = imageUrl.startsWith("data:image/")
          ? imageUrl
          : await convertImageToBase64(imageUrl);

        // 2단계: GPT-4 Vision으로 이미지 분석 및 편집 지시사항 생성
        const visionResponse = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `이 이미지를 분석하고, 다음 편집 요청에 맞는 새로운 이미지 생성을 위한 상세한 프롬프트를 작성해주세요: "${prompt}"\n\n현재 이미지의 스타일, 구성, 색상 등을 유지하면서 요청된 변경사항만 적용하는 DALL-E 3용 프롬프트를 영어로 작성해주세요.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image,
                    detail: "high",
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        });

        const enhancedPrompt =
          visionResponse.choices[0]?.message?.content || prompt;

        // 3단계: DALL-E 3로 새 이미지 생성
        result = await client.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          size: "1024x1024",
          quality: "standard",
          n: 1,
        });
      } catch (editError) {
        throw editError;
      }
    } else {
      // 새로운 이미지 생성 (기존 이미지를 참조로 사용)
      // Responses API를 사용하여 이미지 참조 기반 생성
      const base64Image = imageUrl.startsWith("data:image/")
        ? imageUrl
        : await convertImageToBase64(imageUrl);

      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `다음 이미지를 참조하여 새로운 이미지를 생성해주세요: ${prompt}`,
              },
              {
                type: "input_image",
                image_url: base64Image,
                detail: "auto",
              },
            ],
          },
        ],
        tools: [
          {
            type: "image_generation",
            quality: "medium",
            size: "1024x1024",
          },
        ],
      });

      // 생성된 이미지 추출
      const imageGenerationCalls = response.output.filter(
        (output) => output.type === "image_generation_call"
      );

      if (imageGenerationCalls.length > 0) {
        const imageBase64 = imageGenerationCalls[0].result;
        result = {
          data: [
            {
              b64_json: imageBase64,
            },
          ],
        };
      } else {
        throw new Error("이미지 생성에 실패했습니다.");
      }
    }

    if (result.data && result.data.length > 0) {
      let editedImageUrl: string;

      if (result.data[0].b64_json) {
        // Base64 응답인 경우
        const editedImageBase64 = result.data[0].b64_json;
        editedImageUrl = `data:image/png;base64,${editedImageBase64}`;
      } else if (result.data[0].url) {
        // URL 응답인 경우 - Base64로 변환
        const imageUrl = result.data[0].url;
        editedImageUrl = await convertImageToBase64(imageUrl);
      } else {
        throw new Error("이미지 편집 결과 형태를 인식할 수 없습니다.");
      }

      return NextResponse.json({
        success: true,
        imageUrl: editedImageUrl,
        originalPrompt: prompt,
      });
    } else {
      throw new Error("이미지 편집 결과를 받을 수 없습니다.");
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "이미지 편집 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 이미지 URL을 Base64로 변환하는 헬퍼 함수
async function convertImageToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("이미지를 다운로드할 수 없습니다.");
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = blob.type || "image/png";

  return `data:${mimeType};base64,${base64}`;
}
