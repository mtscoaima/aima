"use client";

import React, { JSX } from "react";
import {
  useNotifications as useNotificationContext,
  Notification,
  NotificationPagination,
} from "@/contexts/NotificationContext";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

// 알림 유틸리티 훅의 반환 타입
interface NotificationUtilsType {
  notifications: Notification[];
  unreadCount: number;
  pagination: NotificationPagination | null;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  handleNotificationClick: (notification: Notification) => Promise<void>;
  getNotificationIcon: (type: string) => JSX.Element;
  getNotificationBgClass: (type: string) => string;
  getRelativeTime: (dateString: string) => string;
  truncateMessage: (message: string, maxLength?: number) => string;
}

// 알림 관련 유틸리티 훅
export function useNotificationUtils(): NotificationUtilsType {
  const context = useNotificationContext();
  const router = useRouter();

  // 알림 클릭 핸들러 (액션 URL로 이동)
  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // 읽지 않은 알림이면 읽음으로 처리
      if (!notification.is_read) {
        await context.markAsRead(notification.id);
      }

      // 액션 URL이 있으면 해당 페이지로 이동
      if (notification.action_url) {
        router.push(notification.action_url);
      }
    },
    [context, router]
  );

  // 알림 타입별 아이콘 반환
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "SUCCESS":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-green-500"
          >
            <path
              d="M13.5 4.5L6 12L2.5 8.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "WARNING":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-yellow-500"
          >
            <path
              d="M8 1L15 14H1L8 1Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 6V9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="12" r="1" fill="currentColor" />
          </svg>
        );
      case "ERROR":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-red-500"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M10 6L6 10M6 6L10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case "BUSINESS_VERIFICATION":
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-blue-500"
          >
            <path
              d="M14 2H2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H14C14.5523 14 15 13.5523 15 13V3C15 2.44772 14.5523 2 14 2Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M6 7H10M6 10H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      default: // INFO
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-blue-500"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 11V8M8 5H8.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
    }
  }, []);

  // 알림 타입별 배경색 클래스 반환
  const getNotificationBgClass = useCallback((type: string) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-50 border-green-200";
      case "WARNING":
        return "bg-yellow-50 border-yellow-200";
      case "ERROR":
        return "bg-red-50 border-red-200";
      case "BUSINESS_VERIFICATION":
        return "bg-blue-50 border-blue-200";
      default: // INFO
        return "bg-blue-50 border-blue-200";
    }
  }, []);

  // 상대 시간 표시 (예: "5분 전", "1시간 전")
  const getRelativeTime = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "방금 전";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }, []);

  // 알림 메시지 요약 (긴 메시지 자르기)
  const truncateMessage = useCallback((message: string, maxLength = 100) => {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + "...";
  }, []);

  return {
    ...context,
    handleNotificationClick,
    getNotificationIcon,
    getNotificationBgClass,
    getRelativeTime,
    truncateMessage,
  };
}
