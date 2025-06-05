# OpenAI 이미지 생성 매뉴얼

## 개요

OpenAI API를 사용하여 텍스트 프롬프트로부터 이미지를 생성하거나 편집할 수 있습니다. GPT Image 또는 DALL·E 모델을 사용하여 이미지 생성 기능에 접근할 수 있습니다.

## API 종류

### 1. Image API
Image API는 세 가지 엔드포인트를 제공합니다:

- **Generations**: 텍스트 프롬프트를 기반으로 처음부터 이미지 생성
- **Edits**: 새로운 프롬프트를 사용하여 기존 이미지를 부분적 또는 전체적으로 수정
- **Variations**: 기존 이미지의 변형 생성 (DALL·E 2만 지원)

지원 모델: `gpt-image-1`, `dall-e-2`, `dall-e-3`

### 2. Responses API
대화나 다단계 플로우의 일부로 이미지를 생성할 수 있습니다. 내장 도구로 이미지 생성을 지원하며, 컨텍스트 내에서 이미지 입력과 출력을 허용합니다.

Image API와 비교한 추가 기능:
- **멀티턴 편집**: 프롬프팅을 통한 반복적인 고품질 이미지 편집
- **스트리밍**: 최종 출력이 생성되는 동안 부분 이미지 표시
- **유연한 입력**: 바이트뿐만 아니라 이미지 파일 ID도 입력으로 허용

## 모델 비교

| 모델 | 엔드포인트 | 사용 사례 |
|------|-----------|----------|
| DALL·E 2 | Image API: Generations, Edits, Variations | 저비용, 동시 요청, 인페인팅 (마스크를 사용한 이미지 편집) |
| DALL·E 3 | Image API: Generations만 | DALL·E 2보다 높은 이미지 품질, 더 큰 해상도 지원 |
| GPT Image | Image API: Generations, Edits | 뛰어난 지시 따르기, 텍스트 렌더링, 세부 편집, 실제 지식 활용 |

**권장**: 고품질 이미지 생성과 실제 지식 활용을 위해 `gpt-image-1` 모델 사용

## 이미지 생성

### 기본 생성

#### Python 예시
```python
from openai import OpenAI
import base64

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1-mini",
    input="Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools=[{"type": "image_generation"}],
)

# 이미지 저장
image_data = [output.result for output in response.output if output.type == "image_generation_call"]
if image_data:
    image_base64 = image_data[0]
    with open("otter.png", "wb") as f:
        f.write(base64.b64decode(image_base64))
```

#### JavaScript 예시
```javascript
import OpenAI from 'openai';
import fs from 'fs';

const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools: [{"type": "image_generation"}],
});

// 이미지 저장
const imageData = response.output.filter(output => output.type === "image_generation_call");
if (imageData.length > 0) {
    const imageBase64 = imageData[0].result;
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    fs.writeFileSync('otter.png', imageBuffer);
}
```

### 멀티턴 이미지 생성
`previous_response_id` 매개변수를 사용하여 여러 턴에 걸쳐 이미지를 반복적으로 개선할 수 있습니다.

#### Python 예시
```python
# 첫 번째 이미지 생성
response = client.responses.create(
    model="gpt-4.1-mini",
    input="Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools=[{"type": "image_generation"}],
)

# 후속 편집
response_followup = client.responses.create(
    model="gpt-4.1-mini",
    previous_response_id=response.id,
    input="Now make it look realistic",
    tools=[{"type": "image_generation"}],
)
```

#### JavaScript 예시
```javascript
// 첫 번째 이미지 생성
const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Generate an image of gray tabby cat hugging an otter with an orange scarf",
    tools: [{"type": "image_generation"}],
});

// 후속 편집
const responseFollowup = await client.responses.create({
    model: "gpt-4.1-mini",
    previous_response_id: response.id,
    input: "Now make it look realistic",
    tools: [{"type": "image_generation"}],
});
```

### 스트리밍
Responses API는 스트리밍 이미지 생성을 지원합니다. `partial_images` 매개변수를 사용하여 1-3개의 부분 이미지를 받을 수 있습니다.

#### Python 예시
```python
stream = client.responses.create(
    model="gpt-4.1",
    input="Draw a gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape",
    stream=True,
    tools=[{
        "type": "image_generation",
        "partial_images": 2
    }],
)

for event in stream:
    if event.type == "response.image_generation_call.partial_image":
        idx = event.partial_image_index
        image_base64 = event.partial_image_b64
        image_bytes = base64.b64decode(image_base64)
        with open(f"river_{idx}.png", "wb") as f:
            f.write(image_bytes)
```

#### JavaScript 예시
```javascript
const stream = await client.responses.create({
    model: "gpt-4.1",
    input: "Draw a gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape",
    stream: true,
    tools: [{
        type: "image_generation",
        partial_images: 2
    }],
});

for await (const event of stream) {
    if (event.type === "response.image_generation_call.partial_image") {
        const idx = event.partial_image_index;
        const imageBase64 = event.partial_image_b64;
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        fs.writeFileSync(`river_${idx}.png`, imageBuffer);
    }
}
```

## 이미지 편집

### 이미지 참조를 사용한 새 이미지 생성
하나 이상의 이미지를 참조로 사용하여 새 이미지를 생성할 수 있습니다.

#### Python 예시
```python
response = client.responses.create(
    model="gpt-4.1",
    input=[{
        "role": "user",
        "content": [
            {"type": "input_text", "text": "Generate a photorealistic image of a gift basket on a white background labeled 'Relax & Unwind' with a ribbon and handwriting-like font, containing all the items in the reference pictures."},
            {"type": "input_image", "image_url": f"data:image/jpeg;base64,{base64_image1}"},
            {"type": "input_image", "image_url": f"data:image/jpeg;base64,{base64_image2}"},
            {"type": "input_image", "file_id": file_id1},
            {"type": "input_image", "file_id": file_id2}
        ]
    }],
    tools=[{"type": "image_generation"}],
)
```

#### JavaScript 예시
```javascript
const response = await client.responses.create({
    model: "gpt-4.1",
    input: [{
        role: "user",
        content: [
            {type: "input_text", text: "Generate a photorealistic image of a gift basket on a white background labeled 'Relax & Unwind' with a ribbon and handwriting-like font, containing all the items in the reference pictures."},
            {type: "input_image", image_url: `data:image/jpeg;base64,${base64Image1}`},
            {type: "input_image", image_url: `data:image/jpeg;base64,${base64Image2}`},
            {type: "input_image", file_id: fileId1},
            {type: "input_image", file_id: fileId2}
        ]
    }],
    tools: [{"type": "image_generation"}],
});
```

### 마스크를 사용한 이미지 편집 (인페인팅)
마스크를 제공하여 이미지의 어느 부분을 편집할지 지정할 수 있습니다.

#### Python 예시
```python
response = client.responses.create(
    model="gpt-4o",
    input=[{
        "role": "user",
        "content": [
            {"type": "input_text", "text": "generate an image of the same sunlit indoor lounge area with a pool but the pool should contain a flamingo"},
            {"type": "input_image", "file_id": fileId}
        ]
    }],
    tools=[{
        "type": "image_generation",
        "quality": "high",
        "input_image_mask": {"file_id": maskId}
    }],
)
```

#### JavaScript 예시
```javascript
const response = await client.responses.create({
    model: "gpt-4o",
    input: [{
        role: "user",
        content: [
            {type: "input_text", text: "generate an image of the same sunlit indoor lounge area with a pool but the pool should contain a flamingo"},
            {type: "input_image", file_id: fileId}
        ]
    }],
    tools: [{
        type: "image_generation",
        quality: "high",
        input_image_mask: {file_id: maskId}
    }],
});
```

**마스크 요구사항**:
- 편집할 이미지와 마스크는 같은 형식과 크기여야 함 (50MB 미만)
- 마스크 이미지는 알파 채널을 포함해야 함

## 이미지 출력 사용자 정의

### 설정 가능한 옵션
- **크기**: 이미지 치수 (예: `1024x1024`, `1024x1536`)
- **품질**: 렌더링 품질 (`low`, `medium`, `high`)
- **형식**: 파일 출력 형식 (`png`, `jpeg`, `webp`)
- **압축**: JPEG 및 WebP 형식의 압축 수준 (0-100%)
- **배경**: 투명 또는 불투명

### 크기 및 품질 옵션
- **사용 가능한 크기**: 
  - `1024x1024` (정사각형)
  - `1536x1024` (가로)
  - `1024x1536` (세로)
  - `auto` (기본값)

- **품질 옵션**: `low`, `medium`, `high`, `auto` (기본값)

### 투명도
`gpt-image-1` 모델은 투명한 배경을 지원합니다. `background` 매개변수를 `transparent`로 설정하면 됩니다.
- PNG 및 WebP 형식에서만 지원
- `medium` 또는 `high` 품질에서 최적 작동

#### Python 예시
```python
response = client.responses.create(
    model="gpt-4.1-mini",
    input="Draw a 2D pixel art style sprite sheet of a tabby gray cat",
    tools=[{
        "type": "image_generation",
        "background": "transparent",
        "quality": "high"
    }],
)
```

#### JavaScript 예시
```javascript
const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Draw a 2D pixel art style sprite sheet of a tabby gray cat",
    tools: [{
        type: "image_generation",
        background: "transparent",
        quality: "high"
    }],
});
```

## 제한사항

- **지연 시간**: 복잡한 프롬프트는 처리에 최대 2분 소요
- **텍스트 렌더링**: DALL·E 시리즈보다 크게 개선되었지만 여전히 정확한 텍스트 배치와 명확성에 어려움
- **일관성**: 여러 생성에 걸쳐 반복되는 캐릭터나 브랜드 요소의 시각적 일관성 유지에 가끔 어려움
- **구성 제어**: 지시 따르기가 개선되었지만 구조화되거나 레이아웃에 민감한 구성에서 요소를 정확히 배치하는 데 어려움

## 콘텐츠 조정

모든 프롬프트와 생성된 이미지는 콘텐츠 정책에 따라 필터링됩니다.

`gpt-image-1`의 경우 `moderation` 매개변수로 조정 엄격성을 제어할 수 있습니다:
- `auto` (기본값): 표준 필터링
- `low`: 덜 제한적인 필터링

## 지원 모델 (Responses API)

이미지 생성 도구를 호출할 수 있는 모델:
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4.1`
- `gpt-4.1-mini`
- `gpt-4.1-nano`
- `o3`

## 비용 및 지연 시간

이미지 생성 비용은 이미지 렌더링에 필요한 토큰 수에 비례합니다. 더 큰 이미지 크기와 높은 품질 설정은 더 많은 토큰을 필요로 합니다.

### 토큰 수 (품질별)

| 품질 | 정사각형 (1024×1024) | 세로 (1024×1536) | 가로 (1536×1024) |
|------|---------------------|------------------|------------------|
| Low | 272 토큰 | 408 토큰 | 400 토큰 |
| Medium | 1056 토큰 | 1584 토큰 | 1568 토큰 |
| High | 4160 토큰 | 6240 토큰 | 6208 토큰 |

최종 비용은 다음의 합계입니다:
- 입력 텍스트 토큰
- 입력 이미지 토큰 (편집 엔드포인트 사용 시)
- 이미지 출력 토큰

### 부분 이미지 비용
`partial_images` 매개변수를 사용한 스트리밍 시, 각 부분 이미지마다 추가로 100개의 이미지 출력 토큰이 발생합니다. 