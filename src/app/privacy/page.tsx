import React from 'react';
import PrivacyPageClient from './PrivacyPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | MTS마케팅',
  description: 'MTS마케팅 개인정보처리방침을 확인하세요. 개인정보 수집, 이용, 제공, 보관 및 파기에 대한 모든 정보를 제공합니다.',
  keywords: ['개인정보처리방침', '개인정보보호', 'MTS마케팅', '프라이버시', '정보보호'],
  openGraph: {
    title: '개인정보처리방침 | MTS마케팅',
    description: 'MTS마케팅 개인정보처리방침',
    url: '/privacy',
    type: 'website',
  },
  alternates: {
    canonical: '/privacy',
  },
};

const PrivacyPage: React.FC = () => {
  return <PrivacyPageClient />;
};

export default PrivacyPage;