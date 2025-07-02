// 클라이언트 사이드에서는 Supabase 클라이언트를 사용하지 않고
// API 호출을 통해서만 데이터에 접근합니다.
// Service Role Key는 서버 사이드에서만 사용됩니다.

// 폴링 간격 설정 (밀리초)
const POLLING_INTERVALS = {
  REFERRALS: 10000, // 10초
  USERS: 15000, // 15초
  TRANSACTIONS: 20000, // 20초
};

// 추천인 테이블 변경사항 구독 (폴링 기반)
export function subscribeToReferrals(
  salespersonId: number,
  onDataChange: () => void
) {
  // 폴링 기반 구현으로 변경 (클라이언트 사이드에서 안전)
  const intervalId = setInterval(() => {
    onDataChange();
  }, POLLING_INTERVALS.REFERRALS);

  return {
    unsubscribe: () => clearInterval(intervalId),
    state: "subscribed",
  };
}

// 사용자 테이블 변경사항 구독 (폴링 기반)
export function subscribeToUserChanges(
  userIds: number[],
  onDataChange: () => void
) {
  if (userIds.length === 0) return null;

  // 폴링 기반 구현으로 변경
  const intervalId = setInterval(() => {
    onDataChange();
  }, POLLING_INTERVALS.USERS);

  return {
    unsubscribe: () => clearInterval(intervalId),
    state: "subscribed",
  };
}

// 트랜잭션 테이블 변경사항 구독 (폴링 기반)
export function subscribeToTransactions(
  salespersonId: number,
  onDataChange: () => void
) {
  // 폴링 기반 구현으로 변경
  const intervalId = setInterval(() => {
    onDataChange();
  }, POLLING_INTERVALS.TRANSACTIONS);

  return {
    unsubscribe: () => clearInterval(intervalId),
    state: "subscribed",
  };
}
