"use client";

import React from 'react';
import TermsLayout from '@/components/terms/TermsLayout';
import { useTermsContent } from '@/hooks/useTermsContent';

const TermsPageClient: React.FC = () => {
  const { data, loading, error } = useTermsContent('SERVICE_TERMS');

  return (
    <TermsLayout
      type="SERVICE_TERMS"
      data={data}
      loading={loading}
      error={error}
    />
  );
};

export default TermsPageClient;