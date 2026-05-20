"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastNotice } from "../../types/canvas-interaction";

const toastVisibleMs = 1800;

export function useCanvasNotifications() {
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const notificationIdRef = useRef(0);
  const [loadNotification, setLoadNotification] = useState<ToastNotice | null>(
    null,
  );

  const showNotification = useCallback((message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    notificationIdRef.current += 1;
    const toastId = notificationIdRef.current;

    setLoadNotification({ id: toastId, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setLoadNotification((currentToast) =>
        currentToast?.id === toastId ? null : currentToast,
      );
      notificationTimeoutRef.current = null;
    }, toastVisibleMs);
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return {
    loadNotification,
    showNotification,
  };
}
