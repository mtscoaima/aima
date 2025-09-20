import React from 'react';
import TermsPageClient from './TermsPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 이용약관 | MTS마케팅',
  description: 'MTS마케팅 서비스 이용약관을 확인하세요. 서비스 이용 시 필요한 모든 조건과 권리, 의무에 대한 내용을 담고 있습니다.',
  keywords: ['이용약관', '서비스약관', 'MTS마케팅', '타깃마케팅', '서비스이용조건'],
  openGraph: {
    title: '서비스 이용약관 | MTS마케팅',
    description: 'MTS마케팅 서비스 이용약관',
    url: '/terms',
    type: 'website',
  },
  alternates: {
    canonical: '/terms',
  },
};

const TermsPage: React.FC = () => {
  return <TermsPageClient />;
};

export default TermsPage;