"use client";

import React from 'react';
import TermsLayout from '@/components/terms/TermsLayout';
import { useTermsContent } from '@/hooks/useTermsContent';

const PrivacyPageClient: React.FC = () => {
  const { data, loading, error } = useTermsContent('PRIVACY_POLICY');

  return (
    <TermsLayout
      type="PRIVACY_POLICY"
      data={data}
      loading={loading}
      error={error}
    />
  );
};

export default PrivacyPageClient;