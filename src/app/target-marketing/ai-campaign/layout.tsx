import React from 'react';

export const metadata = {
  title: 'AI 캠페인 생성 - MTS플러스',
  description: '효과적인 마케팅 캠페인을 쉽게 제작하고 관리하세요',
};

export default function CampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="campaign-layout">
      {children}
    </div>
  );
} 