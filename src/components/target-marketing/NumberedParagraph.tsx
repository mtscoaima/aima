"use client";
import React from "react";

interface Props {
  text: string;
}

// 1) ... 2) ... 형태를 단락으로 분리해 목록으로 렌더링
export default function NumberedParagraph({ text }: Props) {
  if (!text) return null;

  // 안전한 분리: 숫자+')' 패턴을 기준으로 split, 첫 머리 텍스트는 유지
  const parts = text
    .replace(/\s+\n/g, " ")
    .split(/(?=\b\d+\)\s)/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  const [lead, ...items] = parts;

  return (
    <div className="space-y-2">
      <div className="whitespace-pre-wrap">{lead}</div>
      <ol className="list-decimal pl-5 space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="leading-relaxed text-sm text-gray-800">
            {item.replace(/^\d+\)\s*/, "")}
          </li>
        ))}
      </ol>
    </div>
  );
}


