"use client";

import { useCallback, useState } from "react";

export function useReorderableList<T>(initialItems: T[]) {
  const [items, setItems] = useState(initialItems);

  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    setItems((currentItems) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= currentItems.length ||
        toIndex >= currentItems.length
      ) {
        return currentItems;
      }

      const nextItems = currentItems.slice();
      const [movedItem] = nextItems.splice(fromIndex, 1);
      nextItems.splice(toIndex, 0, movedItem);
      return nextItems;
    });
  }, []);

  const resetItems = useCallback((nextItems: T[]) => {
    setItems(nextItems);
  }, []);

  return {
    items,
    reorderItems,
    resetItems,
  };
}
