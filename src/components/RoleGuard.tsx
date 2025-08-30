"use client";

import { useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  redirectTo = "/",
  fallback,
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩 중이면 아무것도 하지 않음
    if (isLoading) return;

    // 사용자 역할이 허용된 역할에 포함되지 않은 경우는 fallback UI를 보여줌
    // 자동 리다이렉트 제거 - 사용자가 버튼을 클릭해서 이동하도록 함
  }, [user, isLoading, isAuthenticated, allowedRoles, redirectTo, router]);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자인 경우
  if (!isAuthenticated) {
    return (
      <div className="access-denied">
        <h2>로그인이 필요합니다</h2>
        <p>이 페이지에 접근하려면 로그인이 필요합니다.</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          로그인하기
        </button>
      </div>
    );
  }

  // 로그인된 사용자의 권한이 없는 경우
  if (isAuthenticated && user && !allowedRoles.includes(user.role)) {
    return (
      fallback || (
        <div className="access-denied">
          <h2>접근 권한이 없습니다</h2>
          <p>이 페이지에 접근할 권한이 없습니다.</p>
          <button
            onClick={() => router.push(redirectTo)}
            className="btn-primary"
          >
            홈으로 돌아가기
          </button>
        </div>
      )
    );
  }

  // 모든 조건을 만족하는 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}

// 관리자 페이지 가드 - 관리자를 제외한 모든 사용자 접근 불가
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자인 경우
  if (!isAuthenticated) {
    return (
      <div className="access-denied">
        <h2>로그인이 필요합니다</h2>
        <p>관리자 페이지에 접근하려면 로그인이 필요합니다.</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          로그인하기
        </button>
      </div>
    );
  }

  // 관리자가 아닌 사용자인 경우
  if (user && user.role !== "ADMIN") {
    return (
      <div className="access-denied">
        <h2>접근 권한이 없습니다</h2>
        <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
        <p>
          현재 권한:{" "}
          {user.role === "SALESPERSON"
            ? "영업사원"
            : user.role === "USER"
            ? "일반 회원"
            : user.role}
        </p>
        <button onClick={() => router.push("/")} className="btn-primary">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 관리자인 경우에만 자식 컴포넌트 렌더링
  return <>{children}</>;
}

// 영업사원 전용 가드 - 일반회원과 로그인하지 않은 유저는 접근 불가
export function SalespersonGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자인 경우
  if (!isAuthenticated) {
    return (
      <div className="access-denied">
        <h2>로그인이 필요합니다</h2>
        <p>영업사원 페이지에 접근하려면 로그인이 필요합니다.</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          로그인하기
        </button>
      </div>
    );
  }

  // 영업사원이 아닌 사용자인 경우
  if (user && user.role !== "SALESPERSON") {
    return (
      <div className="access-denied">
        <h2>접근 권한이 없습니다</h2>
        <p>이 페이지는 영업사원만 접근할 수 있습니다.</p>
        <p>
          현재 권한:{" "}
          {user.role === "ADMIN"
            ? "관리자"
            : user.role === "USER"
            ? "일반 회원"
            : user.role}
        </p>
        <button onClick={() => router.push("/")} className="btn-primary">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 영업사원인 경우에만 자식 컴포넌트 렌더링
  return <>{children}</>;
}

// 일반 회원 페이지 가드 - 영업사원만 접근 불가, 로그인 안한 유저도 접근 가능
export function AdvertiserGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인된 사용자가 SALESPERSON인 경우에만 접근 차단
  if (isAuthenticated && user && user.role === "SALESPERSON") {
    return (
      <div className="access-denied">
        <h2>접근 권한이 없습니다</h2>
        <p>영업사원은 이 페이지에 접근할 수 없습니다.</p>
        <button onClick={() => router.push("/")} className="btn-primary">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 로그인하지 않은 사용자나 SALESPERSON이 아닌 사용자는 접근 허용
  return <>{children}</>;
}

// 일반 회원 페이지 가드 (비활성화 버전) - 영업사원만 접근 불가, 로그인 안한 유저는 비활성화 상태로 접근 가능
export function AdvertiserGuardWithDisabled({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();



  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인된 사용자가 SALESPERSON인 경우에만 접근 차단
  if (isAuthenticated && user && user.role === "SALESPERSON") {
    return (
      <div className="access-denied">
        <h2>접근 권한이 없습니다</h2>
        <p>영업사원은 이 페이지에 접근할 수 없습니다.</p>
        <button onClick={() => router.push("/")} className="btn-primary">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 로그인하지 않은 사용자인 경우 비활성화 상태로 렌더링
  if (!isAuthenticated) {
    return (
      <div className="page-disabled-overlay">
        <div className="login-prompt-banner">
          <div className="login-prompt-content">
            <h3>로그인이 필요합니다</h3>
            <p>모든 기능을 사용하려면 로그인해주세요.</p>
            <button
              onClick={() => router.push("/login")}
              className="btn-primary login-prompt-btn"
            >
              로그인하기
            </button>
          </div>
        </div>
        <div className="page-content-disabled">{children}</div>
      </div>
    );
  }

  // 로그인한 일반 사용자 중 승인 상태가 PENDING 또는 REJECTED인 경우 비활성화 상태로 렌더링
  // approval_status가 없거나 APPROVED가 아니면 승인되지 않은 것으로 간주
  const approvalStatus = user?.approval_status?.toUpperCase() || "PENDING";
  const isPending = !approvalStatus || approvalStatus.includes("PENDING") || approvalStatus === "PENDING";
  const isRejected = approvalStatus.includes("REJECTED") || approvalStatus === "REJECTED";
  const isApproved = approvalStatus === "APPROVED";
  
  if (
    isAuthenticated &&
    user &&
    !isApproved && // APPROVED가 아닌 모든 경우
    (isPending || isRejected)
  ) {
    const title = isRejected ? "계정 승인 거부" : "계정 승인 필요";
    const message = isRejected
      ? "승인이 거부되었습니다. 고객센터(070-8824-1139)로 문의해주세요"
      : "승인 대기 중입니다. 관리자에게 문의해주세요";

    return (
      <div className="page-disabled-overlay">
        <div className={`login-prompt-banner ${isRejected ? "rejected" : ""}`}>
          <div className="login-prompt-content">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>
        <div className="page-content-disabled">{children}</div>
      </div>
    );
  }

  // 로그인한 승인된 일반 사용자는 정상 접근
  return <>{children}</>;
}

// 일반 회원 페이지 가드 (로그인 필수) - 영업사원만 접근 불가, 로그인 안한 유저는 접근 불가
export function AdvertiserLoginRequiredGuard({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자인 경우 접근 차단
  if (!isAuthenticated) {
    return (
      <div className="access-denied">
        <h2>로그인이 필요합니다</h2>
        <p>이 페이지에 접근하려면 로그인이 필요합니다.</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          로그인하기
        </button>
      </div>
    );
  }

  // 로그인된 사용자가 SALESPERSON인 경우에만 접근 차단
  if (isAuthenticated && user && user.role === "SALESPERSON") {
    return (
      <div className="access-denied">
        <h2>접근 권한이 없습니다</h2>
        <p>영업사원은 이 페이지에 접근할 수 없습니다.</p>
        <button onClick={() => router.push("/")} className="btn-primary">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 로그인한 일반 사용자는 정상 접근
  return <>{children}</>;
}
