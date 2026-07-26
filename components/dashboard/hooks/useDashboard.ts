'use client';

import { useMemo, useState } from 'react';

export function useDashboard(groups: any[]) {
  const [showArchived, setShowArchived] = useState(false);

  const activeGroups = useMemo(
    () => groups.filter((g) => !g.archivedAt),
    [groups]
  );

  const archivedGroups = useMemo(
    () => groups.filter((g) => g.archivedAt),
    [groups]
  );

  function toggleArchived() {
    setShowArchived((v) => !v);
  }

  return {
    activeGroups,
    archivedGroups,
    showArchived,
    toggleArchived,
  };
}
