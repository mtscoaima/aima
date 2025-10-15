export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import sharp from "sharp";

const ACCESS_KEY = process.env.NAVER_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.NAVER_SECRET_KEY!;
const SERVICE_ID = process.env.NAVER_SENS_SERVICE_ID!;

interface JWTPayload {
  userId: number;
  email: string;
}

function makeSignature(method: string, path: string, ts: string) {
  const base = `${method} ${path}\n${ts}\n${ACCESS_KEY}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(base).digest("base64");
}

export async function POST(req: NextRequest) {
  try {
    // JWT 인증
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
    }

    try {
      jwt.verify(token, jwtSecret) as JWTPayload;
    } catch {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    // FormData에서 파일 추출
    const form = await req.formData();
    const f = form.get("file") as unknown as File | null;

    if (!f) {
      return NextResponse.json({ success: false, error: "file required" }, { status: 400 });
    }

    // 파일 형식 검증
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(f.type)) {
      return NextResponse.json({ error: "JPG, JPEG, PNG 형식만 지원됩니다", receivedType: f.type }, { status: 400 });
    }

    // 파일 버퍼 생성 및 변환
    let buf = Buffer.from(await f.arrayBuffer());

    // PNG → JPEG 변환 또는 리사이즈 (해상도 1500x1440, 품질 88%)
    try {
      const converted = await sharp(buf)
        .resize(1500, 1440, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toBuffer();
      buf = Buffer.from(converted);
    } catch {
      return NextResponse.json({ error: "이미지 변환 실패" }, { status: 500 });
    }

    // 파일 크기 검증 (300KB 제한)
    const maxSize = 300 * 1024;
    if (buf.length > maxSize) {
      return NextResponse.json({
        error: "이미지 크기는 300KB 이하여야 합니다",
        currentSize: buf.length,
        maxSize
      }, { status: 400 });
    }

    // 파일명 정규화: ASCII, 공백 제거, .jpg 확장자
    let baseName = (f.name || "image").normalize("NFKD").replace(/[^\x20-\x7E]/g, "_");
    baseName = baseName.replace(/\.(png|jpeg|jpg)$/i, "");
    baseName = baseName.replace(/\s+/g, "");
    baseName = baseName.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    const fileName = (baseName || "image") + ".jpg";

    // Base64 인코딩
    const fileBody = buf.toString("base64");

    // Naver SENS 업로드
    const method = "POST";
    const path = `/sms/v2/services/${SERVICE_ID}/files`;
    const ts = Date.now().toString();
    const sig = makeSignature(method, path, ts);

    const res = await fetch(`https://sens.apigw.ntruss.com${path}`, {
      method,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-iam-access-key": ACCESS_KEY,
        "x-ncp-apigw-timestamp": ts,
        "x-ncp-apigw-signature-v2": sig,
      },
      body: JSON.stringify({ fileName, fileBody }),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `SENS upload failed: HTTP ${res.status} - ${text}`,
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json({
      success: true,
      ...data,
      fileName,
      fileSize: buf.length
    });

  } catch (e) {
    const error = e as Error;
    return NextResponse.json({ success: false, error: error?.message || String(e) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
