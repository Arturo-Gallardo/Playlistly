"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { useVideoSearch } from "../../hooks/toolbar/useVideoSearch";
import type { CanvasTile } from "../../lib/canvas/canvas-layout";
import { cn } from "../../lib/cn";

type ToolbarVideoSearchProps = {
  disabled?: boolean;
  onFocusTile: (tileId: string) => void;
  tiles: CanvasTile[];
};

export function ToolbarVideoSearch({
  disabled = false,
  onFocusTile,
  tiles,
}: ToolbarVideoSearchProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const search = useVideoSearch({ onFocusTile, tiles });

  const showPanel =
    search.isOpen && search.query.trim().length > 0 && !disabled;

  const matchSummary =
    search.matches.length > 0
      ? `${search.matches.length} match${search.matches.length === 1 ? "" : "es"}`
      : search.query.trim()
        ? "No matches"
        : null;

  useEffect(() => {
    if (!showPanel) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        rootRef.current?.contains(event.target)
      ) {
        return;
      }

      search.setIsOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [search, showPanel]);

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      search.clearSearch();
      inputRef.current?.blur();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      search.focusNextMatch();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      search.focusPreviousMatch();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      search.focusActiveMatchAndAdvance();
    }
  }

  return (
    <div
      className={cn(
        "toolbar-video-search",
        disabled && "toolbar-video-search-disabled",
      )}
      ref={rootRef}
    >
      <label className="sr-only" htmlFor={`${listboxId}-input`}>
        Find video on canvas
      </label>
      <div className="toolbar-video-search-field">
        <Search
          aria-hidden="true"
          className="toolbar-video-search-icon"
          strokeWidth={1.8}
        />
        <input
          aria-activedescendant={
            showPanel && search.listed[search.activeMatchIndex]
              ? `${listboxId}-option-${search.listed[search.activeMatchIndex]?.id}`
              : undefined
          }
          aria-controls={showPanel ? listboxId : undefined}
          aria-expanded={showPanel}
          autoComplete="off"
          className="toolbar-video-search-input"
          disabled={disabled}
          id={`${listboxId}-input`}
          onChange={(event) => search.handleQueryChange(event.target.value)}
          onFocus={() => search.setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Find video…"
          ref={inputRef}
          role="combobox"
          spellCheck={false}
          type="text"
          value={search.query}
        />
      </div>

      {showPanel ? (
        <div
          className="toolbar-video-search-panel"
          id={listboxId}
          role="listbox"
        >
          {matchSummary ? (
            <p className="toolbar-video-search-panel-meta font-control">
              {matchSummary}
              {search.matches.length > 0
                ? ` · ${search.activeMatchIndex + 1} of ${search.matches.length}`
                : null}
            </p>
          ) : null}

          {search.matches.length > 0 ? (
            <>
              <ul className="toolbar-video-search-list">
                {search.listed.map((tile) => {
                  const isActive =
                    search.matches[search.activeMatchIndex]?.id === tile.id;

                  return (
                    <li key={tile.id}>
                      <button
                        aria-selected={isActive}
                        className={cn(
                          "toolbar-video-search-option",
                          isActive && "toolbar-video-search-option-active",
                        )}
                        id={`${listboxId}-option-${tile.id}`}
                        onClick={() => {
                          search.focusMatchAtIndex(
                            search.matches.findIndex(
                              (match) => match.id === tile.id,
                            ),
                          );
                          inputRef.current?.focus();
                        }}
                        role="option"
                        type="button"
                      >
                        <span className="toolbar-video-search-option-title">
                          {tile.video.title}
                        </span>
                        {tile.video.channelTitle ? (
                          <span className="toolbar-video-search-option-channel">
                            {tile.video.channelTitle}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {search.overflowCount > 0 ? (
                <p className="font-control toolbar-video-search-overflow">
                  +{search.overflowCount} more — press Enter to cycle
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
