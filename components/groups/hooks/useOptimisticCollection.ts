import { useMemo, useState } from 'react';

type WithId = {
  id: string;
};

export function useOptimisticCollection<T extends WithId>(serverItems: T[]) {
  const [optimisticById, setOptimisticById] = useState<Record<string, T>>({});
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState<string[]>(
    []
  );

  const items = useMemo(() => {
    const deletedIds = new Set(optimisticDeletedIds);

    const baseItems = serverItems
      .filter((item) => !deletedIds.has(item.id))
      .map((item) => optimisticById[item.id] ?? item);

    const optimisticOnly = Object.values(optimisticById).filter(
      (item) =>
        !deletedIds.has(item.id) &&
        !serverItems.some((serverItem) => serverItem.id === item.id)
    );

    return [...optimisticOnly, ...baseItems];
  }, [optimisticById, optimisticDeletedIds, serverItems]);

  function upsert(nextItem: T) {
    setOptimisticById((current) => ({
      ...current,
      [nextItem.id]: nextItem,
    }));

    setOptimisticDeletedIds((current) =>
      current.filter((id) => id !== nextItem.id)
    );
  }

  function remove(itemId: string) {
    setOptimisticDeletedIds((current) =>
      current.includes(itemId) ? current : [...current, itemId]
    );

    setOptimisticById((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  return {
    items,
    upsert,
    remove,
  };
}
