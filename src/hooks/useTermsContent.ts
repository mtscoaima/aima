"use client";

import { useState, useEffect, useCallback } from 'react';
import { TermType, TermsData, getTermsContent, getMultipleTermsContent } from '@/lib/termsService';

interface UseTermsContentResult {
  data: TermsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMultipleTermsResult {
  data: TermsData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// 간단한 메모리 캐시
const cache = new Map<string, { data: TermsData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 단일 약관 조회 훅
 */
export function useTermsContent(type: TermType): UseTermsContentResult {
  const [data, setData] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 캐시 확인
      const cached = cache.get(type);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      const termsData = await getTermsContent(type);

      // 캐시에 저장
      cache.set(type, { data: termsData, timestamp: Date.now() });

      setData(termsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '약관을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error(`약관 조회 에러 (${type}):`, err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  return {
    data,
    loading,
    error,
    refetch: fetchTerms
  };
}

/**
 * 여러 약관 조회 훅
 */
export function useMultipleTermsContent(types: TermType[]): UseMultipleTermsResult {
  const [data, setData] = useState<TermsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMultipleTerms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const termsData = await getMultipleTermsContent(types);
      setData(termsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '약관을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('다중 약관 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [types]);

  useEffect(() => {
    if (types.length > 0) {
      fetchMultipleTerms();
    }
  }, [fetchMultipleTerms]);

  return {
    data,
    loading,
    error,
    refetch: fetchMultipleTerms
  };
}

/**
 * 캐시 무효화 함수 (관리자가 약관을 수정했을 때 사용)
 */
export function invalidateTermsCache(type?: TermType) {
  if (type) {
    cache.delete(type);
  } else {
    cache.clear();
  }
}

/**
 * 캐시 상태 확인 함수
 */
export function getTermsCacheInfo() {
  const cacheInfo = Array.from(cache.entries()).map(([key, value]) => ({
    type: key,
    timestamp: value.timestamp,
    age: Date.now() - value.timestamp,
    expired: Date.now() - value.timestamp > CACHE_DURATION
  }));

  return {
    size: cache.size,
    entries: cacheInfo
  };
}