"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

// 알림 데이터 타입
export interface Notification {
  id: number;
  recipient_user_id?: number | null;
  recipient_role?: string | null;
  sender_user_id?: number | null;
  title: string;
  message: string;
  type: string;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

// 페이지네이션 정보
export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Context 타입
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  pagination: NotificationPagination | null;
  isLoading: boolean;
  error: string | null;

  // 함수들
  fetchNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// 폴링 간격 (30초)
const POLLING_INTERVAL = 30000;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<NotificationPagination | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API 호출을 위한 공통 함수
  const makeApiCall = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "요청이 실패했습니다.");
      }

      return response.json();
    },
    []
  );

  // 알림 목록 조회
  const fetchNotifications = useCallback(
    async (page = 1, unreadOnly = false) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          ...(unreadOnly && { unread_only: "true" }),
        });

        const data = await makeApiCall(`/api/notifications?${params}`);

        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setPagination(data.pagination || null);
      } catch (err) {
        console.error("알림 조회 실패:", err);
        setError(
          err instanceof Error ? err.message : "알림을 불러오는데 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, makeApiCall]
  );

  // 특정 알림을 읽음으로 처리
  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!isAuthenticated) return;

      try {
        await makeApiCall(`/api/notifications/${notificationId}/read`, {
          method: "PUT",
        });

        // 로컬 상태 업데이트
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : notification
          )
        );

        // 읽지 않은 알림 개수 업데이트
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("알림 읽음 처리 실패:", err);
        setError(
          err instanceof Error ? err.message : "알림 읽음 처리에 실패했습니다."
        );
      }
    },
    [isAuthenticated, makeApiCall]
  );

  // 모든 알림을 읽음으로 처리
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await makeApiCall("/api/notifications/mark-all-read", {
        method: "PUT",
      });

      // 로컬 상태 업데이트
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("모든 알림 읽음 처리 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : "모든 알림 읽음 처리에 실패했습니다."
      );
    }
  }, [isAuthenticated, makeApiCall]);

  // 알림 새로고침
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(1, false);
  }, [fetchNotifications]);

  // 초기 로드 및 폴링 설정
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();

      // 폴링 설정
      const interval = setInterval(() => {
        fetchNotifications();
      }, POLLING_INTERVAL);

      return () => clearInterval(interval);
    } else {
      // 로그아웃 시 상태 초기화
      setNotifications([]);
      setUnreadCount(0);
      setPagination(null);
      setError(null);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // 페이지 가시성 변경 시 알림 새로고침
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        refreshNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated, refreshNotifications]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Context 사용을 위한 훅
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications는 NotificationProvider 내부에서 사용되어야 합니다."
    );
  }
  return context;
}
