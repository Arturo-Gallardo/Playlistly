"use client";

import { useCallback, useMemo, useState } from "react";
import type { CanvasTile } from "../../lib/canvas/canvas-layout";
import {
  findTilesByVideoQuery,
  getListedVideoSearchMatches,
} from "../../lib/canvas/video-search";

type UseVideoSearchOptions = {
  onFocusTile: (tileId: string) => void;
  tiles: CanvasTile[];
};

export function useVideoSearch({ onFocusTile, tiles }: UseVideoSearchOptions) {
  const [query, setQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(
    () => findTilesByVideoQuery(tiles, query),
    [query, tiles],
  );

  const { listed, overflowCount } = useMemo(
    () => getListedVideoSearchMatches(matches),
    [matches],
  );

  const focusMatchAtIndex = useCallback(
    (index: number) => {
      const match = matches[index];

      if (!match) {
        return;
      }

      setActiveMatchIndex(index);
      onFocusTile(match.id);
    },
    [matches, onFocusTile],
  );

  const focusNextMatch = useCallback(() => {
    if (matches.length === 0) {
      return;
    }

    const nextIndex = (activeMatchIndex + 1) % matches.length;
    focusMatchAtIndex(nextIndex);
  }, [activeMatchIndex, focusMatchAtIndex, matches.length]);

  const focusPreviousMatch = useCallback(() => {
    if (matches.length === 0) {
      return;
    }

    const previousIndex =
      (activeMatchIndex - 1 + matches.length) % matches.length;
    focusMatchAtIndex(previousIndex);
  }, [activeMatchIndex, focusMatchAtIndex, matches.length]);

  const focusActiveMatchAndAdvance = useCallback(() => {
    if (matches.length === 0) {
      return;
    }

    focusMatchAtIndex(activeMatchIndex);
    setActiveMatchIndex((activeMatchIndex + 1) % matches.length);
  }, [activeMatchIndex, focusMatchAtIndex, matches.length]);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setActiveMatchIndex(0);
    setIsOpen(true);
  }

  function clearSearch() {
    setQuery("");
    setActiveMatchIndex(0);
    setIsOpen(false);
  }

  return {
    activeMatchIndex,
    clearSearch,
    focusMatchAtIndex,
    focusActiveMatchAndAdvance,
    focusNextMatch,
    focusPreviousMatch,
    isOpen,
    listed,
    matches,
    overflowCount,
    query,
    setIsOpen,
    handleQueryChange,
  };
}
