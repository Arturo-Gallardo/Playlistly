"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

const toastVisibleMs = 1600;

type ContactEmailLinkProps = {
  email: string;
};

export function ContactEmailLink({ email }: ContactEmailLinkProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      resetTimerRef.current = null;
    }, toastVisibleMs);
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    try {
      await navigator.clipboard.writeText(email);
      setToastMessage("Copied");
    } catch {
      setToastMessage("Copy failed");
    }

    hideToast();
  }

  return (
    <span className="legal-contact-email">
      {toastMessage ? (
        <span className="legal-contact-email-toast" role="status">
          {toastMessage}
        </span>
      ) : null}
      <a
        className="legal-page-link legal-contact-email-link"
        href={`mailto:${email}`}
        onClick={(event) => void handleClick(event)}
        title="Click to copy · middle-click to email"
      >
        {email}
      </a>
    </span>
  );
}
