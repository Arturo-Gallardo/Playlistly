"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToolbarTooltipWrapProps = {
  children: ReactNode;
  hint?: string;
  label: string;
};

type TooltipPosition = {
  left: number;
  top: number;
};

export function ToolbarTooltipWrap({
  children,
  hint,
  label,
}: ToolbarTooltipWrapProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    left: 0,
    top: 0,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isHovered) {
      return;
    }

    function updateTooltipPosition() {
      const targetElement = targetRef.current;

      if (!targetElement) {
        return;
      }

      const rect = targetElement.getBoundingClientRect();

      setTooltipPosition({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 9,
      });
    }

    updateTooltipPosition();
    window.addEventListener("scroll", updateTooltipPosition, true);
    window.addEventListener("resize", updateTooltipPosition);

    return () => {
      window.removeEventListener("scroll", updateTooltipPosition, true);
      window.removeEventListener("resize", updateTooltipPosition);
    };
  }, [isHovered]);

  function showTooltip() {
    const targetElement = targetRef.current;

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();

      setTooltipPosition({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 9,
      });
    }

    setIsHovered(true);
  }

  return (
    <div
      className="toolbar-tooltip-wrap"
      onPointerEnter={showTooltip}
      onPointerLeave={() => setIsHovered(false)}
    >
      <div
        className="toolbar-tooltip-target"
        onPointerDown={() => setIsHovered(false)}
        ref={targetRef}
      >
        {children}
      </div>
      {isMounted && isHovered
        ? createPortal(
            <span
              className="toolbar-tooltip toolbar-tooltip-portal font-control toolbar-tooltip-visible"
              role="tooltip"
              style={{
                left: `${tooltipPosition.left}px`,
                top: `${tooltipPosition.top}px`,
              }}
            >
              <span className="toolbar-tooltip-label">{label}</span>
              {hint ? (
                <span className="toolbar-tooltip-hint">{hint}</span>
              ) : null}
            </span>,
            document.body,
          )
        : null}
    </div>
  );
}
