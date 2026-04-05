import { useState, useCallback } from 'react';

interface Identifiable {
  id: string;
}

export function useItemSelection<T extends Identifiable>() {
  const [selectedItems, setSelectedItems] = useState<T[] | null>(null);

  const handleItemPress = useCallback((item: T) => {
    setSelectedItems((prev) => {
      if (prev?.some((r) => r.id === item.id)) {
        return prev.filter((r) => r.id !== item.id);
      }
      if (!prev) {
        return [item];
      }
      return [...prev, item];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(null);
  }, []);

  const isSelected = useCallback(
    (item: T) => selectedItems?.some((r) => r.id === item.id) ?? false,
    [selectedItems],
  );

  return {
    selectedItems,
    setSelectedItems,
    handleItemPress,
    clearSelection,
    isSelected,
    hasSelection: !!selectedItems?.length,
    selectionCount: selectedItems?.length ?? 0,
  };
}
