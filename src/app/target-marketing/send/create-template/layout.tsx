import React from 'react';

export const metadata = {
  title: '템플릿 제작 - MTS플러스',
  description: '효과적인 마케팅 템플릿을 쉽게 제작하고 관리하세요',
};

export default function TemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="template-layout">
      {children}
    </div>
  );
} 